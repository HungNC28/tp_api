import * as express from "express";
import { SensorNS } from "../sensor/sensor";
import { ZoneNS } from "../zone/zone";
import { HttpBadRequest, HttpError, HttpParamValidators, HttpStatusCodes } from '../lib/http';

const Metrics: {
    code: string; input_code: string; name: string
}[] = [
        { code: "WA", input_code: 'water', name: 'Mực nước' },
        { code: "WAU", input_code: 'water_up', name: 'Mực nước thượng lưu' },
        { code: 'WAD', input_code: 'water_do', name: 'Mực nước hạ lưu' },
        { code: "WAO", input_code: 'water_overflow', name: 'Mực nước tràn' },

        { code: "DR", input_code: 'drain', name: 'Độ mở cống' },
        { code: "DR1", input_code: 'drain_1', name: 'Độ mở cống 1' },
        { code: "DR2", input_code: 'drain_2', name: 'Độ mở cống 2' },
        { code: "DR3", input_code: 'drain_3', name: 'Độ mở cống 3' },

        { code: "SA", input_code: 'salt', name: 'Độ mặn' },
        { code: "RA", input_code: 'rain', name: 'Lượng mưa' },
        { code: "TE", input_code: 'temp', name: 'Nhiệt độ' },
        { code: "VO", input_code: 'volt', name: 'Điện áp' },

        { code: "WP", input_code: 'water_proof', name: 'Mực nước thấm' },
        { code: "WP1", input_code: 'water_proof_1', name: 'Mực nước thấm 1' },
        { code: "WP2", input_code: 'water_proof_2', name: 'Mực nước thấm 2' },
        { code: "WP3", input_code: 'water_proof_3', name: 'Mực nước thấm 3' },
        { code: "WP4", input_code: 'water_proof_4', name: 'Mực nước thấm 4' },
    ];

const MapMetricCodeToInputCode = new Map(Metrics.map(m => [m.code, m.input_code]));
const PartnerKeys = new Set([
    'vanhanhho:tTJMjbgtZdmt35y1Vw3AJxI9n4HuLRon',
    'internal',
    'thuanphong:box:9MwEeIceSrA3CHCNVtU8tQA',
]);

function getAccessToken(req: express.Request) {
    const auth_header = req.header('Authorization');
    if (auth_header) {
        return auth_header.substr('Bearer '.length);
    }
    const access_token = req.query.access_token;
    return access_token as string;
}

export function NewPartnerAPI(
    sensorBLL: SensorNS.BLL,
    zoneBLL: ZoneNS.BLL,
) {
    const router = express.Router();
    const ONE_HOUR = 3600;

    router.use((req, res, next) => {
        const auth = getAccessToken(req);
        if (!auth) {
            const err = new HttpError("missing access token", HttpStatusCodes.Unauthorized);
            next(err);
            return;
        }
        if (!PartnerKeys.has(auth)) {
            console.log(`got invalid access token ${auth}`);
            const err = new HttpError("invalid access token", HttpStatusCodes.Unauthorized);
            next(err);
            return;
        }
        next();
    });

    router.get("/zone/list", async (req, res) => {
        const zones = await zoneBLL.ListZone();
        res.json(zones);
    });

    router.get("/group/list", async (req, res) => {
        const { zone_id } = req.query;
        const groups = await zoneBLL.ListGroup(zone_id as string);
        res.json(groups);
    });

    router.get("/box/list", async (req, res) => {
        const { group_id } = req.query;
        const boxes = await zoneBLL.ListBox({ group_id: group_id as string });
        res.json(boxes);
    });

    router.get("/metric/list", async (req, res) => {
        res.json(Metrics);
    });

    const now = () => Math.round(Date.now() / 1000);
    const formatRecord = (r) => {
        const obj = {
            ts: r.t
        };
        const keys = Object.keys(r);
        for (const k of keys) {
            if (MapMetricCodeToInputCode.has(k)) {
                obj[MapMetricCodeToInputCode.get(k)] = r[k];
            }
        }
        return obj;
    }

    const acceptMetrics = (r, metric: string[]) => {
        const obj = {ts: r.ts};
        for (const k of metric) {
            if (r[k]) {
                obj[k] = r[k];
            }
        }
        if (Object.keys(obj).length === 1) {
            return null;
        }
        return obj;
    }

    router.get('/sensor/data', async (req, res) => {
        const { group_id } = req.query;
        if (!group_id) {
            throw HttpBadRequest("group_id is required");
        }
        const skip = +req.query.skip || 0;
        const limit = +req.query.limit || 0;
        const max = +req.query.max_ts || now();
        const min = +req.query.min_ts || (max - 24 * ONE_HOUR);
        const query = {
            time: [min * 1000, max * 1000] as [number, number],
            limit,
            skip
        };
        const records = await sensorBLL.ListRecordByGroup(group_id as string, query);
        console.log(`partner requested data for ${group_id} time [${min},${max}]: ${records.length} records`,);
        let result: any[] = records.map(formatRecord);
        const metric = (req.query.metric as string || '').split(',').filter(l => l.length > 1);
        if (metric.length > 0) {
            console.log(metric);
            result = result.map(r => acceptMetrics(r, metric)).filter(r => r);
        }
        res.json(result);
    });

    let test_loa_canh_bao = 0;
    let test_loa_canh_bao_active = false;
    let test_loa_canh_bao_reset = null;

    function anyExceed(record: any, field_prefix: string, max_value: number) {
        for (const p in record) {
            if (p.startsWith(field_prefix)) {
                const v = Math.abs(record[p]);
                if (v >= max_value) {
                    return true;
                }
            }
        }
    }

    async function computeLoaCanhBao(group_id: string, max_value: number) {
        const boxes = await zoneBLL.ListBox({ group_id });
        const latestRecord = (box_id: string) => {
            return sensorBLL.ListRecord(box_id, { limit: 1 }).then(records => records[0])
        };
        const records = await Promise.all(boxes.map(box => latestRecord(box.id)));
        max_value = +max_value || 5;
        for (const r of records) {
            if (anyExceed(r, "ICI", max_value)) {
                return 1;
            }
            if (anyExceed(r, "MEI", max_value)) {
                return 1;
            }
        }
        return 0;
    }

    router.use("/script/:name", async (req, res) => {
        const { name = '' } = req.params;
        const { group_id } = req.query;
        if (group_id !== '79R4HBQI') {
            res.end(`unknown group_id ${group_id}`);
            return;
        }
        if (name === 'loa_canh_bao') {
            if (test_loa_canh_bao_active) {
                res.end(`${test_loa_canh_bao}`);
            } else {
                const max_value = +req.query.max_value;
                const v = await computeLoaCanhBao(group_id, max_value);
                res.end(`${v}`);
            }
        } else if (name === 'test_loa_canh_bao') {
            if (req.method !== 'POST') {
                res.end(`must use POST method`);
                return;
            }
            const { value, active } = req.query;
            test_loa_canh_bao = value === '1' ? 1 : 0;
            test_loa_canh_bao_active = active === 'true';
            // if (active) {
            //     const ONE_MINUTE = 60e3;
            //     const WAIT_TIME = 24 * 60 * ONE_MINUTE;
            //     if (test_loa_canh_bao_reset) {
            //         clearTimeout(test_loa_canh_bao_reset);
            //     }
            //     test_loa_canh_bao_reset = setTimeout(
            //         () => test_loa_canh_bao_active = false,
            //         WAIT_TIME,
            //     );
            // }
            res.end(`active=${active}&value=${test_loa_canh_bao}`);
        } else {
            res.end(`unknown script name ${name}`);
        }
    });

    return router;
}
