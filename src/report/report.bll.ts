import { startOfMonth, endOfMonth } from "date-fns";
import { ReportNS } from "../report/report";
import { ZoneNS } from "../zone/zone";

const id_DOT2 = "UUAF4RA4";
const id_DOT1 = "79R4HBQI";
const DAY = 24 * 60 * 60 * 1000;
const YEAR = 365 * DAY;

function isNumber(value: any) {
    return typeof value === 'number';
}

export class ReportBLLBase implements ReportNS.BLL {
    constructor(
        private dal: ReportNS.DAL,
        private zoneBll: ZoneNS.BLL

    ) { }

    async init() { }

    async ListStatistic(zone_id: string) {
        const docs = await this.zoneBll.ListGroup(zone_id);
        console.log("docs",docs);
        const dot2 = docs.find(g => g.id === id_DOT2);
        const groups: ReportNS.ViewStatistic[] = docs.filter(g => {
            if (g.id === id_DOT1) g.boxs = [...g.boxs, ...dot2.boxs]
            if (g.id !== id_DOT2) return g;
        });
        const now = Date.now();
        await Promise.all(groups.map(async group => {
            let total = 0;
            let last = 0;
            let total_month = 0;
            // let total_year = 0;
            group.boxs = await Promise.all(group.boxs.map(async box => {
                let ltime = 0;
                const count = await this.dal.CountRecords(box.id);
                total += count;
                const count_month = await this.dal.CountRecords(box.id, { start: now - 30 * DAY, end: now });
                total_month +=count_month;
                // const count_year = await this.dal.CountRecords(box.id, { start: now - YEAR, end: now });
                // total_year += count_year;
                const last_record = await this.dal.GetLastRecord(box.id);
                if (last_record) {
                    if (!isNumber(last_record._id)) ltime = last_record.c;
                    else if (last_record?._id * 1000 > Date.now()) ltime = last_record.c
                    else ltime = last_record._id;
                    if (+ltime > last) last = ltime;
                }
                return { ...box, count };
            }))
            group.total = total;
            group.last = last;
            group.total_month = total_month;
            // group.total_year = total_year;
            return group;
        }))
        return groups;
    }

    async GetStatistic(group_id: string) {
        const doc = await this.zoneBll.GetGroup(group_id);
        if (group_id === id_DOT1) {
            const dot2 = await this.zoneBll.GetGroup(id_DOT2);
            doc.boxs = [...doc.boxs, ...dot2.boxs]
        }
        const now = Date.now();
        let total = 0;
        let last = 0;
        let total_month = 0;
        doc.boxs = await Promise.all(doc.boxs.map(async box => {
            let ltime = 0;
            const count = await this.dal.CountRecords(box.id);
            total += count;
            const last_record = await this.dal.GetLastRecord(box.id);
            if (last_record) {
                if (!isNumber(last_record._id)) ltime = last_record.c;
                else if (last_record?._id * 1000 > Date.now()) ltime = last_record.c
                else ltime = last_record._id
                if (+ltime > last) last = ltime;
            }
            const count_month = await this.dal.CountRecords(box.id, { start: now - 30 * DAY, end: now });
            total_month += count_month;
            return { ...box, count, ltime, count_month };
        }));

        return { ...doc, last, total, total_month }
    }

    async GetLastRecord(group_id: string) {
        const doc = await this.dal.GetLastRecord(group_id)
        return doc
    }

    async GetCountRecords30Days(zone_id: string) {
        const docs = await this.zoneBll.ListGroup(zone_id);
        const dot2 = docs.find(g => g.id === id_DOT2);
        const groups = docs.filter(g => {
            if (g.id === id_DOT1) g.boxs = [...g.boxs, ...dot2.boxs]
            if (g.id !== id_DOT2) return g;
        });
        const now = Date.now();
        
        let labels = ['thang'];
        let datasets = [];
        await Promise.all(groups.map(async group => {
            const obj = {
                label: group.name,
                data: []
            }
            let total = 0;
            group.boxs = await Promise.all(group.boxs.map(async box => {
                const count = await this.dal.CountRecords(box.id, {start: now - 30 * DAY, end: now})
                total += count
                return box
            }));
            obj.data.push(total)
            datasets.push(obj)
        }))
        return { datasets, labels }
    }

    async GetTotalRecordsByMonth(zone_id: string) {
        const docs = await this.zoneBll.ListGroup(zone_id);
        const dot2 = docs.find(g => g.id === id_DOT2);
        const groups = docs.filter(g => {
            if (g.id === id_DOT1) g.boxs = [...g.boxs, ...dot2.boxs]
            if (g.id !== id_DOT2) return g;
        });
        const datasets = []
        const months = await this.GetListMonth();

        await Promise.all(groups.map(async group => {
            let obj = {
                label: group.name,
                data: []
            }
            await Promise.all(months.map(async m => {
                let total = 0
                const range = await this.GetTimeStartEnd(m);
                group.boxs = await Promise.all(group.boxs.map(async box => {
                    const count = await this.dal.CountRecords(box.id, range)
                    total += count
                    return box
                }))
                obj.data.push(total)
                return m
            }))
            datasets.push(obj)
            return group
        }))
        return {datasets, labels: months}
    }

    async GetListMonth() {
        const now = new Date()
        let months = [];
        let month = now.getMonth() + 2;
        let year = now.getFullYear();
        for (let i = 0; i < 6; i++) {
            month = month - 1;
            if (month === 0) {
                month = 12;
                year = year - 1;
            }
            const str = year + "-" + (month < 10 ? "0" + month : month);
            months.unshift(str);
        }
        return months
    }

    async GetTimeStartEnd(month: string) {
        const start = startOfMonth(new Date(month + "01")).getTime();
        const end = endOfMonth(new Date(month + "01")).getTime();
        return { start, end }
    }
}
