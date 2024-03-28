import { MongoClient, ClientSession } from 'mongodb';

export { Db as MongoDB, MongoError } from 'mongodb';

export const enum MongoErrorCodes {
    Duplicate = 11000
}

function RenameOne<T, U>(doc: T, from: string, to: string) {
    if (!doc) {
        return null;
    }
    const obj: U = {} as any;
    for (const [k, v] of Object.entries(doc)) {
        if (k === from) {
            obj[to] = v;
        } else {
            obj[k] = v;
        }
    }
    return obj;
}

function RenameArray<T, U>(docs: T[], from: string, to: string) {
    if (!docs) {
        return [];
    }
    const res: U[] = [];
    for (const d of docs) {
        res.push(RenameOne<T, U>(d, from, to));
    }
    return res;
}

export type MongoModel<T> = Pick<T, Exclude<keyof T, 'id'>> & { _id: string };

export const ToMongoData = {
    Many<T>(docs: T[]) {
        return RenameArray<T, MongoModel<T>>(docs, 'id', '_id');
    },
    One<T>(doc: T) {
        return RenameOne<T, MongoModel<T>>(doc, 'id', '_id');
    }
}

export const FromMongoData = {
    Many<T>(docs: MongoModel<T>[]) {
        return RenameArray<MongoModel<T>, T>(docs, '_id', 'id');
    },
    One<T>(doc: MongoModel<T>) {
        return RenameOne<MongoModel<T>, T>(doc, '_id', 'id');
    }
}

async function checkReplicaSet(client: MongoClient) {
    const adminDb = client.db('admin');
    try {
        const info = await adminDb.executeDbAdminCommand({ replSetGetStatus: 1 });
        const members = info.members.map(m => m.name);
        console.log(`mongodb replica set [${info.set}] members [${members.join(',')}]`);
        return false;
    } catch (err) {
        if (err.codeName === 'NoReplicationEnabled') {
            console.log(`mongodb replica set not enabled, check mongod.cfg for (replication: replSetName: "rs0")`);
            throw new Error('mongodb replica set not enabled');
        } else if (err.codeName === 'NotYetInitialized') {
            console.log('mongodb has no replica set, initiating a new one');
            await adminDb.executeDbAdminCommand({
                replSetInitiate: 1
            });
            return true;
        } else if (err.codeName === 'Unauthorized') {
            console.log('unauthorized check for mongodb replica set, you need root role for this command')
            return false;
        } else {
            throw err;
        }
    }
}

async function Connect(url: string, opts: { replica?: boolean } = {}) {
    const client = new MongoClient(url, {
        useUnifiedTopology: true
    });
    await client.connect();
    if (!opts.replica) {
        return client;
    }
    const newSetCreated = await checkReplicaSet(client);
    if (newSetCreated) {
        console.log('mongodb replica set initiated, wait for 10 seconds');
        await new Promise(r => setTimeout(r, 10000));
    }
    return client;
}

const sessionSymbol = Symbol('session');

export const MongoCommon = {
    Connect,
    WithSession<T>(ctx: T, session: ClientSession) {
        ctx[sessionSymbol] = session;
        return ctx;
    },
    Session(ctx: any) {
        return ctx[sessionSymbol] as ClientSession;
    }
}