import {
    FromMongoData,
    MongoDB,
    ToMongoData,
    MongoErrorCodes,
} from "../lib/mongodb";
import { ZoneNS } from "./zone";

export class ZoneDALMongo implements ZoneNS.DAL {
    constructor(private db: MongoDB) {}

    async init() {
        this.col_zone.createIndex(
            { code: 1 },
            { name: "code", unique: true, background: true }
        );
        this.col_box.createIndex(
            { device_id: 1 },
            { name: "device_id", unique: true, background: true }
        );
    }

    private col_zone = this.db.collection("zone");
    private col_box = this.db.collection("box");
    private col_box_group = this.db.collection("box_group");

    async ListZone() {
        const docs = await this.col_zone.find().toArray();
        return FromMongoData.Many<ZoneNS.Zone>(docs);
    }

    async GetZone(id: string) {
        const doc = await this.col_zone.findOne({ _id: id });
        return FromMongoData.One<ZoneNS.Zone>(doc);
    }

    async CreateZone(zone: ZoneNS.Zone) {
        try {
            const doc = ToMongoData.One(zone);
            await this.col_zone.insertOne(doc);
        } catch (err) {
            if (err.code === MongoErrorCodes.Duplicate) {
                throw ZoneNS.Errors.ErrZoneCodeExisted;
            } else {
                throw err;
            }
        }
    }

    async UpdateZone(zone: ZoneNS.Zone) {
        try {
            const doc = ToMongoData.One(zone);
            await this.col_zone.updateOne({ _id: zone.id }, { $set: doc });
        } catch (err) {
            if (err.code === MongoErrorCodes.Duplicate) {
                throw ZoneNS.Errors.ErrZoneCodeExisted;
            } else {
                throw err;
            }
        }
    }

    async ListBox(filter: ZoneNS.FilterBoxParams) {
        const docs = await this.col_box.find(filter).toArray();
        return FromMongoData.Many<ZoneNS.Box>(docs);
    }

    async GetBox(id: string) {
        const doc = await this.col_box.findOne({ _id: id });
        return FromMongoData.One<ZoneNS.Box>(doc);
    }

    async CreateBox(box: ZoneNS.Box) {
        try {
            const doc = ToMongoData.One(box);
            await this.col_box.insertOne(doc);
        } catch (err) {
            if (err.code === MongoErrorCodes.Duplicate) {
                throw ZoneNS.Errors.ErrBoxDeviceExisted;
            } else {
                throw err;
            }
        }
    }

    async UpdateBox(box: ZoneNS.Box) {
        try {
            const doc = ToMongoData.One(box);
            await this.col_box.updateOne({ _id: box.id }, { $set: doc });
        } catch (err) {
            if (err.code === MongoErrorCodes.Duplicate) {
                throw ZoneNS.Errors.ErrBoxDeviceExisted;
            } else {
                throw err;
            }
        }
    }

    async ListGroup(zone_id: string) {
        const docs = await this.col_box_group.find({ zone_id }).toArray();
        return FromMongoData.Many<ZoneNS.BoxGroup>(docs);
    }

    async GetGroup(id: string) {
        const doc = await this.col_box_group.findOne({ _id: id });
        return FromMongoData.One<ZoneNS.BoxGroup>(doc);
    }

    async CreateGroup(box_group: ZoneNS.BoxGroup) {
        try {
            const doc = ToMongoData.One(box_group);
            await this.col_box_group.insertOne(doc);
        } catch (err) {
            if (err.code === MongoErrorCodes.Duplicate) {
                throw ZoneNS.Errors.ErrBoxGroupExisted;
            } else {
                throw err;
            }
        }
    }

    async UpdateGroup(box_group: ZoneNS.BoxGroup) {
        const doc = ToMongoData.One(box_group);
        await this.col_box_group.updateOne(
            { _id: box_group.id },
            { $set: doc }
        );
    }

    async ReportByMetric(sources: Array<string>, metrics: Array<string>) {
        const reports = [];
        const $match = metrics.reduce((array, prev) => {
            return [...array, ...[{ [prev]: { $gte: 0 } }]];
        }, []);
        await Promise.all(
            metrics.map(async (m) => {
                await Promise.all(
                    sources.map(async (s) => {
                        const collection = await this.db.collection(s);
                        const data = await collection
                            .aggregate([
                                {
                                    $match: { $or: $match },
                                },
                                {
                                    $project: {
                                        _id: {
                                            $convert: {
                                                input: {
                                                    $multiply: ["$_id", 1000],
                                                },
                                                to: "date",
                                            },
                                        },
                                        [m]: 1,
                                    },
                                },
                                {
                                    $project: {
                                        month: { $month: "$_id" },
                                        year: { $year: "$_id" },
                                        metric: m,
                                        value: `$${m}`,
                                    },
                                },
                                {
                                    $group: {
                                        _id: {
                                            month: "$month",
                                            year: "$year",
                                            metric: m,
                                        },
                                        count: { $sum: 1 },
                                        total: { $sum: "$value" },
                                    },
                                },
                            ])
                            .toArray();
                        data.length > 1
                            ? reports.push(...data)
                            : data.length == 1
                            ? reports.push(data[0])
                            : reports;
                    })
                );
            })
        );
        return reports.map((r) => {
            const { _id: d, ...res } = r;
            return { info: d, ...res };
        });
    }
}
