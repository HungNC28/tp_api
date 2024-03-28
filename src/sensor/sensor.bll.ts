import { ZoneNS } from "../zone/zone";
import { SensorNS } from "./sensor";
import { Compute } from "./interpolation";
import { AdjustSensorRecord } from "./adjust";

export class SensorBLLBase implements SensorNS.BLL {
    constructor(
        private dal: SensorNS.DAL,
        private zoneBLL: ZoneNS.BLL
    ) { }

    private async getSource(box_id: string) {
        // const box = await this.zoneBLL.GetBox(box_id);
        const source = `sensor_data_${box_id}`;
        return source;
    }

    async CountRecord(box_id: string, query: SensorNS.QueryRecord) {
        const source = await this.getSource(box_id);
        const docs = await this.dal.CountRecord(source, query);
        return docs;
    }

    async ListRecord(box_id: string, query: SensorNS.QueryRecord) {
        const source = await this.getSource(box_id);
        const group = await this.zoneBLL.FindGroup(box_id);
        const func = new Compute(group.id);
        let docs: Array<SensorNS.Record>
        if (query) {
            docs = await this.dal.ListRecord(source, query);
        } else {
            docs = await this.dal.ListRecord(source);
        }
        for (const d of docs) {
            // Stop Adjust
            // AdjustSensorRecord(box_id, d);
            if (Object.keys(d).includes("WAU")) {
                d["V"] = func.CalculateWaterIndex(d["WAU"]);
                d["Q_of"] = func.CalculateWaterOverFlow(d["WAU"]);
                if (Object.keys(d).includes("DR1")) {
                    d["Q"] = func.CalculateWaterFlow(d["WAU"], d["DR1"])
                }
            }
            for (const k in d) {
                // remove index VO and TE
                // if (["VO", "TE"].includes(k)) {
                //     delete d[k]
                // } else {
                    d[k] = SensorNS.Util.RoundValue(d[k]);
                // }
            }
        }
        return docs;
    }

    async ListMetric() {
        const docs = await this.dal.ListMetric();
        return docs;
    }

    async GetMetric(filter: object) {
        const doc = await this.dal.GetMetric(filter);
        // console.log(doc, "dddddd");
        // if (!doc) {
        //     throw SensorNS.Errors.ErrMetricNotFound
        // }
        return doc;
    }

    async CreateMetric(params: SensorNS.CreateMetricParams) {
        if (!params.code) {
            throw SensorNS.Errors.ErrMetricMustHaveCode;
        }
        const doc: SensorNS.Metric = {
            id: SensorNS.Generator.NewMetricId(),
            code: params.code,
            name: params.name,
            unit: params.unit,
            alias: params.alias,
            range: params.range,
            ctime: Date.now(),
            mtime: Date.now()
        }
        await this.dal.CreateMetric(doc);
        return doc;
    }

    async UpdateMetric(id: string, params: SensorNS.UpdateMetricParams) {
        const metric = await this.GetMetric({ id });
        const doc = { ...metric, ...params };
        await this.dal.UpdateMetric(doc);
        return doc;
    }

    async DeleteMetric(id: string): Promise<SensorNS.Metric> {
        const doc = await this.GetMetric({ id });
        doc.dtime = Date.now();
        await this.dal.UpdateMetric(doc);
        return doc;
    }

    async AddRecord(box_id: string, record: SensorNS.Record) {
        const datasource = await this.getSource(box_id);
        await this.dal.AddRecord(datasource, record);
    }

    async ReportRecord(box_id: string, query: SensorNS.QueryRecord) {
        const source = await this.getSource(box_id);
        const docs = await this.dal.ReportRecord(source, query);
        for (const d of docs) {
            for (const k in d) {
                k !== "t" ? d[k] = SensorNS.Util.RoundValue(d[k]) : d[k];
            }
        }
        return docs;
    }

    // async ListSensor() {
    //     const docs = await this.dal.ListSensor();
    //     return docs;
    // }

    // async GetSensor(id: string) {
    //     const doc = await this.dal.GetSensor(id);
    //     return doc;
    // }

    async ListRecordByGroup(group_id: string, query: SensorNS.QueryRecord) {
        const boxes = await this.zoneBLL.ListBox({ group_id: group_id as string });
        if (boxes.length < 1) {
            return [];
        }
        const getRecords = (box_id: string) => this.ListRecord(box_id, query);
        const all = await Promise.all(boxes.map(b => getRecords(b.id)));
        // merge data for each timestamp
        const data = new Map<number, SensorNS.Record>();
        for (const a of all) {
            for (const r of a) {
                if (!data.has(r.t)) data.set(r.t, {} as any);
                // merge by timestamp
                Object.assign(data.get(r.t), r);
            }
        }
        // sort the data by timestamp and format the output
        const result = [...data.values()]
            .sort((a, b) => a.t > b.t ? -1 : 1);
        return result;
    }
}