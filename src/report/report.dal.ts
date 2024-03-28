import { MongoDB } from "../lib/mongodb";
import { ReportNS } from "./report";

export class ReportDALMongo implements ReportNS.DAL {
    constructor(private db: MongoDB) { }

    async init() { }

    async GetStatistic(box_id: string) {
        const filter = {} as any;
        filter.dtime = {
            $exists: false
        }
        const cl = `sensor_data_${box_id}`;
        const count = await this.db.collection(cl).countDocuments(filter)
        return count;
    }

    async CountRecords(box_id: string, query: ReportNS.CountQuery) {
        const filter = {} as any;
        if (query && query.start && query.end) {
            filter._id = {
                $lte: Math.ceil(query.end / 1000),
                $gte: Math.floor(query.start / 1000)
            }
        }
        if (query && query.dtime) filter.dtime = {
            $exists: query.dtime
        }
        const cl = `sensor_data_${box_id}`;
        const count = await this.db.collection(cl).countDocuments(filter);
        return count;
    }

    async GetLastRecord(box_id: string) {
        const cl = `sensor_data_${box_id}`;
        const doc = await this.db.collection(cl).find().limit(1).sort({ _id: -1 }).toArray();
        if (doc.length > 0) return doc[0];
        return null;
    }
}
