import * as express from "express";
import { HttpParamValidators } from '../lib/http';
import { ZoneNS } from "../zone/zone";
import { SensorNS } from "./sensor";
import { ConvertToCSV, removeVietnameseTones } from "../ext/parse_data";
import { format, startOfDay, endOfDay } from "date-fns";
import { ExportExcel } from "../ext/export_excel";
import { ConvertCodeToNameMetric , ConvertDataToAOA , CompareObject , ConvertDataExport, DeleteCtime } from "./sensor.api.middleware";

export function NewSensorAPI(
    sensorBLL: SensorNS.BLL,
    zoneBLL: ZoneNS.BLL,
) {
    const router = express.Router();
    const ONE_HOUR = 3600e3;

    router.get('/:slug(box|group)', async (req, res) => {
        const slugs = req.params["slug"];
        const skip = +req.query.skip || 0;
        // const limit = +req.query.limit || 100;
        const max = +req.query.max_ts || Date.now();
        const min = +req.query.min_ts || (max - 24 * ONE_HOUR);
        const query: SensorNS.QueryRecord = {
            time: [min, max],
            skip,
            // limit,
        }
        if (slugs === "box") {
            const box_id = HttpParamValidators.MustBeString(req.query, 'id');
            const [records, count] = await Promise.all([
                sensorBLL.ListRecord(box_id, query),
                sensorBLL.CountRecord(box_id, query)
            ]);
            return res.json({ count, records });
        }
        if (slugs === "group") {
            const group_id = HttpParamValidators.MustBeString(req.query, 'id');
            if (group_id === "IXC8QY8W") {
                query.time = [min + 8 * ONE_HOUR, max + 8 * ONE_HOUR];
            }
            const boxs = await zoneBLL.ListBox({ group_id });
            const results = await Promise.all(boxs.map(async b => {
                const [records, count] = await Promise.all([
                    sensorBLL.ListRecord(b.id, query),
                    sensorBLL.CountRecord(b.id, query)
                ]);
                const metrics = b.metrics.map(m => m.code);
                const box = await zoneBLL.GetBox(b.id);
                return { count, box, metrics, records }
            }))
            if (req.query.metric) {
                const metric = HttpParamValidators.MustBeString(req.query, "metric", 1);
                const docs = results.filter(r => r.metrics.includes(metric));
                return res.json(docs);
            }
            return res.json(results)
            // const results = await sensorBLL.ListRecordByGroup(group_id, query);
            // return res.json(results);
        }
    });

    router.get("/zone", async (req, res) => {
        const zone_id = HttpParamValidators.MustBeString(req.query, 'zone_id');
        const groups = await zoneBLL.ListGroup(zone_id);
        let boxes: Array<ZoneNS.Box> = [];
        for (let group of groups) {
            boxes.push(...group.boxs)
        }
        const query: SensorNS.QueryRecord = {
            time: null,
            limit: 10,
        }
        const arr = await Promise.all(boxes.map(async (box) => {
            const records = await sensorBLL.ListRecord(box.id, query);
            return { box_id: box.id, records };
        }));
        res.json(arr);
    });

    router.get("/box/export", async (req, res) => {
        const box_id = HttpParamValidators.MustBeString(req.query, 'id');
        let min = startOfDay(Date.now()).getTime();
        let max = endOfDay(Date.now()).getTime();
        if (req.query.start_date) {
            min = startOfDay(new Date(req.query.start_date as string)).getTime();
        }
        if (req.query.end_date) {
            max = endOfDay(new Date(req.query.end_date as string)).getTime();
        }
        const query: SensorNS.QueryRecord = {
            time: [min, max]
        }
        const docs = await sensorBLL.ReportRecord(box_id, query);
        const data = docs.map(d => {
            const obj = { t : d["t"] };
            const keys = Object.keys(d);
            const arrPosition = [...Array(keys.length - 1)].map((_, i) => i + 1).filter(n => (n-1) % 3 === 0);
            arrPosition.forEach(n => {
                obj[keys[n].split("_")[0]] = [
                    d[keys[n]],
                    d[keys[n+1]],
                    SensorNS.Util.RoundValue(d[keys[n+2]])
                ]
            })
            return obj;
        })
        const reports = await ConvertCodeToNameMetric(data, sensorBLL);
        res.json(reports);
    })

    router.get("/box/:slug(export_excel|export_csv|report)", async (req, res) => {
        const slugs = req.params["slug"];
        const box_id = HttpParamValidators.MustBeString(req.query, 'id');
        const skip = +req.query.skip || 0;
        // const limit = +req.query.limit || 100;
        let min = startOfDay(Date.now()).getTime();
        let max = endOfDay(Date.now()).getTime();
        if (req.query.start_date) {
            min = startOfDay(new Date(req.query.start_date as string)).getTime();
        }
        if (req.query.end_date) {
            max = endOfDay(new Date(req.query.end_date as string)).getTime();
        }
        const query: SensorNS.QueryRecord = {
            time: [min, max],
            skip,
            // limit,
        }

        // TODO: check group_id cay men
        const groups = await zoneBLL.ListBox({ group_id: "IXC8QY8W" });
        const groupIds = await Promise.all(groups.map(g => g.id));
        if (groupIds.includes(box_id)) {
            query.time = [min + 8 * ONE_HOUR, max + 8 * ONE_HOUR];
        }

        const box = await zoneBLL.GetBox(box_id);
        const box_name = removeVietnameseTones(box.name);
        const docs = await sensorBLL.ListRecord(box_id, query);
        const data = await ConvertCodeToNameMetric(docs, sensorBLL);
        const start = format(query.time[0], "dd-MM-yyyy");
        const end = format(query.time[1], "dd-MM-yyyy");
        const space_col = "";
        const title = [space_col, space_col, space_col, space_col, `THỐNG KÊ TRẠM ĐO ${box.name.toLocaleUpperCase()}`];
        const start_date = [`Từ ngày : ${start}`];
        const end_date = [`Đến ngày : ${end}`];
        const author = [`Người lập : Admin`];
        const header = [
            title, 
            start_date,
            end_date,
            author
        ]
        const file_name = `${box_name}_${start}_${end}`;
        if (slugs === SensorNS.ExportType.Excel) {
            const data_format = await Promise.all(data.map(el => {
                const { Ngày: t,...res } = el;
                return { Ngày : format(t * 1000, "dd/MM/yyyy-hh:mmaaaaa'm'"), ...res };
            }))
            const sample = await ConvertDataExport(data_format);
            return ExportExcel(req, res, sample, header, box_name.substr(0,10), file_name);
        }
        if (slugs == SensorNS.ExportType.CSV) {
            const newDocs = DeleteCtime(docs);
            res.set('Content-Type', 'text/csv;chart-set=u4f-8');
            res.setHeader("Content-Disposition", `attachment;filename=${file_name}.csv`);
            return res.status(200).end(ConvertToCSV(newDocs));
        }
        if (slugs == SensorNS.ExportType.Report) {
            const query: SensorNS.QueryRecord = {
                time: [min, max]
            }
            const docs = await sensorBLL.ReportRecord(box_id, query);
            const reports = await ConvertDataToAOA(docs, sensorBLL);
            return ExportExcel(req, res, reports, header, box_name.substr(0,10), file_name);
        }
    })

    router.get("/metric/list", async (req, res) => {
        const metrics = await sensorBLL.ListMetric();
        res.json(metrics);
    });

    router.get("/metric/get", async (req, res) => {
        let filter = {} as any;
        if (req.query.code) {
            filter.code = HttpParamValidators.MustBeString(req.query, "code", 1);
        }
        if (req.query.id) {
            filter.id = HttpParamValidators.MustBeString(req.query, "id", 2);
        }
        const doc = await sensorBLL.GetMetric(filter);
        res.json(doc);
    })

    router.post("/metric/create", async (req, res) => {
        const params: SensorNS.CreateMetricParams = {
            code: HttpParamValidators.MustBeString(req.body, "code", 1),
            alias: HttpParamValidators.MustBeString(req.body, "alias", 2),
            name: HttpParamValidators.MustBeString(req.body, "name", 1),
            unit: HttpParamValidators.MustBeString(req.body, "unit"),
            range: req.body.range
        }
        const doc = await sensorBLL.CreateMetric(params);
        res.json(doc);
    })

    router.post("/metric/update", async (req, res) => {
        const id = HttpParamValidators.MustBeString(req.query, "id", 2);
        const params: SensorNS.UpdateMetricParams = req.body
        const doc = await sensorBLL.UpdateMetric(id, params);
        res.json(doc);
    })

    router.post("/metric/delete", async (req, res) => {
        const id = HttpParamValidators.MustBeString(req.query, "id", 2);
        const doc = await sensorBLL.DeleteMetric(id);
        res.json(doc);
    })

    router.get("/monitor", async (req, res) => {
        const skip = +req.query.skip || 0;
        const limit = +req.query.limit || 100;
        const min = startOfDay(Date.now()).getTime();
        const max = endOfDay(Date.now()).getTime();
        const query: SensorNS.QueryRecord = {
            skip,
            limit,
            time: [min, max]
        };
        const box_id = (req.query.box_id as string).split(",") as Array<string>;
        const docs = await Promise.all(box_id.map(async id => {
            const records = await sensorBLL.ListRecord(id, query);
            const box = await zoneBLL.GetBox(id);
            const results = records.map(r => {
                const obj = {
                    t: r.t,
                    c: r.c
                };
                box.metrics.forEach(m => {
                    if (m.code in r) obj[m.code] = r[m.code];
                })
                const compute_index = ["Q", "V", "Q_of"];
                compute_index.forEach(k => {
                    if (r[k] || r[k] === +0) obj[k] = r[k]
                })

                return obj;
            })
            return { [id]: results }
        }))
        res.json(docs);
    })

    router.post("/box/import/:id", async (req,res) => {
        const data = req.body;
        const box_id = HttpParamValidators.MustBeString(req.params, 'id');
        const records = await sensorBLL.ListRecord(box_id);
        const newRecords = DeleteCtime(records);
        let count = 0;
        data.map(async d => {
            const result = newRecords.some(r => CompareObject(r,d));
            if (!result) {
                count ++
                await sensorBLL.AddRecord(box_id, d);
            }
        })
        res.json(count)
    })

    return router;
}
