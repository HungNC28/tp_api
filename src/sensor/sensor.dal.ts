import { ToMongoData , FromMongoData, MongoErrorCodes } from "../lib/mongodb";
import { Db } from "mongodb";
import { SensorNS } from "./sensor";
import { format, differenceInDays, startOfDay, endOfDay } from "date-fns";
export class SensorDALMongo implements SensorNS.DAL {
    constructor(private db: Db) { }

    private col_metric = this.db.collection("metric");

    async init() {
        this.col_metric.createIndex({ code: 1 }, { name: 'code', unique: true, background: true });
    }
    
    private async getDatasource(datasource: string) {
        return this.db.collection(datasource);
    }
    
    private queryToFilter(query: SensorNS.QueryRecord) {
        const filter = {} as any;
        if (Array.isArray(query.time)) {
            filter._id = {
                $gte: Math.floor(query.time[0] / 1000),
                $lte: Math.ceil(query.time[1] / 1000)
            };
        }
        return filter;
    }

    async CountRecord(source: string, query?: SensorNS.QueryRecord) {
        let filter = {} as any;
        const col = await this.getDatasource(source);
        if (query) {
            filter = this.queryToFilter(query);
        }
        const n = await col.countDocuments(filter, {});
        return n;
    }

    async ListRecord(source: string, query?: SensorNS.QueryRecord) {
        const col = await this.getDatasource(source);
        let filter = {} as any;
        let time = {} as any;
        if (query) {
            filter = this.queryToFilter(query);
            time = {
                skip: query.skip,
                limit: query.limit,
                sort: { _id: -1 }
            }
        }
        const docs = await col.find(
            filter,
            time
        ).toArray();
        return docs.map(d => {
            const { _id: t, ...res } = d;
            return { t, ...res };
        });
    }

    async AddRecord(datasource : string, record : SensorNS.Record) {
        const collection = await this.getDatasource(datasource);
        const { t :_id, ...res } = record;
        try {
            await collection.insertOne({_id, ...res})
        } catch(err) {
            throw err
        }
    }

    async ListMetric() {
        const docs = await this.col_metric.find().toArray();
        return FromMongoData.Many<SensorNS.Metric>(docs)
    }

    async GetMetric(filter : object) {
        let obj = ToMongoData.One(filter);
        const doc = await this.col_metric.findOne(obj);
        return FromMongoData.One<SensorNS.Metric>(doc);
    }

    async CreateMetric(metric : SensorNS.Metric) {
        try {
            const doc = ToMongoData.One(metric);
            await this.col_metric.insertOne(doc);
        } catch(err) {
            if (err.code == MongoErrorCodes.Duplicate) {
                throw SensorNS.Errors.ErrMetricCodeExisted
            } else {
                throw err;
            }
        }
    }

    async UpdateMetric(metric : SensorNS.Metric) {
        const doc = ToMongoData.One(metric);
        await this.col_metric.updateOne({_id : metric.id} , {$set : doc});
    }

    async ReportRecord(source : string, query: SensorNS.QueryRecord ) {
        const col = await this.getDatasource(source);
        const date = differenceInDays(query.time[1], query.time[0]);
        const arrDate = [...Array(date + 1)].map((_, index) => {
            const ONE_DAY = 24 * 3600e3;
            const timeStamp = query.time[1] - index * ONE_DAY;
            return format(timeStamp, "yyyy/MM/dd")
        })
        const docs = await col.find().toArray();
        let keys = [];
        let $project, $group : any;
        if (docs.length > 0) {
            // get key _id with RA ( not VO or TE )
            const k = Object.keys(docs[0]);
            keys = k.filter(string => ["_id", "RA"].includes(string))

            $project = keys.reduce((obj, string) => {
                string === "_id" ? obj[string] = 0 : obj[string] = 1;
                return obj;
            }, {});
            
            $group = keys.reduce((obj, string) => {
                string === "_id" ? obj[string] = "$date" :
                Object.assign(obj, {
                    [string + "_max"] : { $max : `$${string}`},
                    [string + "_min"] : { $min : `$${string}`},
                    [string + "_avg"] : { $avg : `$${string}`},
                }) 
                return obj;
            }, {});

            const reports = await Promise.all(arrDate.map(async d => {
                const time = {
                    start : startOfDay(new Date(d)).getTime(),
                    end : endOfDay(new Date(d)).getTime()
                }
                const $match = { 
                    _id : { 
                        $gte: Math.floor(time.start / 1000),
                        $lte: Math.ceil(time.end / 1000)
                    }
                }
                const docs = await col.aggregate([
                    { $match },
                    { $project : {
                        date : d,
                        ...$project,
                    }},
                    { $group }
                ]).toArray();
                return docs[0];
            }))
    
            return reports.filter(r => r != null).map(r => {
                if (r._id) {
                    const { _id : t, ...res} = r;
                    return { t, ...res };
                } 
            });
        }
        return [];
    }
}
