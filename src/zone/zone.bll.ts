import { ZoneNS } from "./zone";
import { FilterData } from "../ext/parse_data";
import { CompareObject } from "../sensor/sensor.api.middleware";
export class ZoneBLLBase implements ZoneNS.BLL {
    constructor(
        private dal: ZoneNS.DAL,
    ) { }

    async init() { }

    async ListZone() {
        const docs = await this.dal.ListZone();
        return docs;
    }

    async GetZone(id: string) {
        const doc = await this.dal.GetZone(id);
        if (!doc) {
            throw ZoneNS.Errors.ErrZoneNotFound;
        }
        return doc;
    }

    async CreateZone(params: ZoneNS.CreateZoneParams) {
        const now = Date.now();
        const doc: ZoneNS.Zone = {
            id: ZoneNS.Generator.NewZoneId(),
            code: params.code,
            name: params.name,
            detail: params.detail,
            center: params.center,
            ctime: now,
            mtime: now
        }
        await this.dal.CreateZone(doc);
        return doc;
    }

    async UpdateZone(id: string, params: ZoneNS.UpdateZoneParams) {
        const doc = await this.dal.GetZone(id);
        doc.mtime = Date.now();
        const zone = {...doc, ...params};
        await this.dal.UpdateZone(zone);
        return zone;
    }

    async ListBox(filter: ZoneNS.FilterBoxParams) {
        const doc = await this.dal.ListBox(filter);
        const boxs = FilterData<ZoneNS.Box>(doc);
        return boxs;
    }

    async GetBox(id: string) {
        const doc = await this.dal.GetBox(id);
        if (!doc) {
            throw ZoneNS.Errors.ErrBoxNotFound;
        }
        return doc;
    }

    async CreateBox(params: ZoneNS.CreateBoxParams) {
        const now = Date.now();
        const lat = +params.location.lat;
        const lng = +params.location.lng;
        await this.GetZone(params.zone_id);
        const metrics: ZoneNS.BoxMetric[] = (params.metrics || []).map(m => {
            const mt = {
                code: m.code,
                metric: m.metric,
                name: m.name,
                lat: +m.lat,
                lng: +m.lng,
                warning1: m.warning1,
                warning2: m.warning2,
                warning3: m.warning3
            }
            return mt;
        });
        const boxes = await this.ListBox({ group_id : params.group_id });
        const max_sort_order = ZoneNS.Util.Max(boxes, 0) + 1;
        const doc: ZoneNS.Box = {
            id: ZoneNS.Generator.NewBoxId(),
            name: params.name,
            desc: params.desc,
            group_id: params.group_id,
            zone_id: params.zone_id,
            location: { lat, lng },
            device_id: params.device_id,
            metrics,
            type: params.type,
            sort_order: max_sort_order,
            ctime: now,
            mtime: now,
        }
        await this.dal.CreateBox(doc);
        return doc;
    }

    // async UpdateGroupForCreateBox(id: string, box_id: string) {
    //     const box_group = await this.GetGroup(id);
    //     box_group.mtime = Date.now();
    //     box_group.box_ids.push(box_id);
    //     await this.dal.UpdateGroup({...box_group})
    // }

    async UpdateBox(id: string, params: ZoneNS.UpdateBoxParams) {
        const now = Date.now();
        const box = await this.dal.GetBox(id);
        const doc = { ...box, ...params };
        doc.mtime = now;
        await this.dal.UpdateBox(doc);
        return doc;
    }

    async DeleteBox(id: string) {
        const doc = await this.GetBox(id);
        doc.dtime = Date.now();
        await this.dal.UpdateBox(doc);
        return doc;
}

    async ListGroup(zone_id: string) {
        const docs = await this.dal.ListGroup(zone_id);
        const view_group = await Promise.all(docs.map(async el => {
            const boxs = await this.ListBox({ group_id : el.id });
            return {
                ...el,
                boxs
            }
        }));
        const groups = FilterData<ZoneNS.ViewBox>(view_group);
        return groups;
    }

    async GetGroup(id: string) {
        const doc = await this.dal.GetGroup(id);
        if (!doc) {
            throw ZoneNS.Errors.ErrBoxGroupNotFound;
        }
        const boxs = await this.ListBox({ group_id : id });
        const filter_boxs = FilterData<ZoneNS.Box>(boxs);
        return { ...doc, boxs : filter_boxs };
    }

    async CreateGroup(params: ZoneNS.CreateGroupParams) {
        const groups = await this.ListGroup(params.zone_id);
        const max_sort_order = ZoneNS.Util.Max(groups, 0) + 1;
        const box_group: ZoneNS.BoxGroup = {
            id: ZoneNS.Generator.NewBoxGroupId(),
            name: params.name,
            zone_id: params.zone_id,
            sort_order: max_sort_order,
            zoom: params.zoom,
            center: params.center,
            cameras: params.cameras,
            subdomain: params.subdomain,
            ctime: Date.now(),
            mtime: Date.now()
        }
        await this.dal.CreateGroup(box_group);
        return box_group;
    }

    async UpdateGroup(id: string, params: ZoneNS.UpdateGroupParams) {
        const box_group = await this.GetGroup(id);
        box_group.mtime = Date.now();
        const doc = { ...box_group, ...params };
        await this.dal.UpdateGroup(doc);
        return doc;
    }

    async DeleteGroup(id: string) {
        const box_group = await this.GetGroup(id);
        box_group.dtime = Date.now();
        await this.dal.UpdateGroup(box_group);
        return box_group;
    }

    async ReportByMetric(box_group_id: string, metrics: Array<string>) {
        const group = await this.GetGroup(box_group_id);
        const sources = await Promise.all(group.boxs.map(b => `sensor_data_${b.id}`));
        const docs = await this.dal.ReportByMetric(sources, metrics);
        const month = [...Array(12)].map((_, index) => index + 1).sort((a,b) => b-a);
        const infos = [] as any;
        metrics.forEach(me => {
            month.forEach(m => {
                const [now, preYear] = [
                    {
                        month : m,
                        year : new Date().getFullYear(),
                        metric : me
                    },
                    {
                        month : m,
                        year : new Date().getFullYear() - 1,
                        metric : me
                    }
                ]
                if (now.month <= new Date().getMonth() + 1) {
                    infos.push(now);
                }
                infos.push(preYear);
            })
        })
        const result = infos.map(i => {
            const data : ZoneNS.Report = {
                info : i,
                count : +0,
                total : +0
            };
            for (const d of docs) {
                if (CompareObject(i, d.info)) {
                    data.count += d.count;
                    data.total += d.total;
                }
            }
            data.total = ZoneNS.Util.RoundValue(data.total);
            return data;
        })
        result.sort((a,b) => a.info.month - b.info.month);
        // const filter_data = [];
        // for (let i = 0; i < result.length ;) {
        //     const array = [result[i], result[i+1], result[i+2], result[i+3]];
        //     if (!array.every(r => r.total === 0)) {
        //         filter_data.push(...array);
        //     } 
        //     i += +metrics.length * 2;
        // }
        // return filter_data;
        return result;
    }

    async FindGroup(id: string) {
        const box = await this.GetBox(id);
        const group = await this.dal.GetGroup(box.group_id);
        return group;
    }    
} 