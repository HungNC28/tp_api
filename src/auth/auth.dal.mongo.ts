import { UserAuthNS } from "./auth";
import { MongoDB, FromMongoData, ToMongoData, MongoErrorCodes } from "../lib/mongodb";

export class UserAuthDALMongo implements UserAuthNS.DAL {
    constructor(
        private db: MongoDB
    ) { }

    async init() {
        await this.col_user_secret.createIndex("user_id");
    }

    private col_user_secret = this.db.collection("user_secret");
    private col_user_session = this.db.collection("user_session");

    async SaveUserSecret(obj: UserAuthNS.UserSecret) {
        await this.col_user_secret.updateOne({
            user_id: obj.user_id,
            name: obj.name
        }, {
            $set: {
                user_id: obj.user_id,
                name: obj.name,
                value: obj.value,
                encode: obj.encode,
            }
        }, { upsert: true });
    }

    async GetUserSecret(user_id: string, name: string) {
        const doc = await this.col_user_secret.findOne({ user_id, name });
        return FromMongoData.One<UserAuthNS.UserSecret>(doc);
    }

    async CreateUserSession(session: UserAuthNS.UserSession) {
        const doc = ToMongoData.One(session);
        await this.col_user_session.insertOne(doc);
    }

    async GetUserSession(id: string) {
        const doc = await this.col_user_session.findOne({_id : id});
        return FromMongoData.One<UserAuthNS.UserSession>(doc);
    }
}
