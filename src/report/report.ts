import { ZoneNS } from "../zone/zone";

export namespace ReportNS {
    export interface Statistic extends ZoneNS.ViewBox {
        total?: number;
        last?: number;
    }

    export interface CountQuery {
        start: number;
        end: number;
        dtime?: Boolean;
    }

    export interface ViewStatistic extends ZoneNS.BoxGroup {
        boxs: Array<ZoneNS.Box>;
        total?: number;
        last?: number;
        total_month?: number;
        total_year?: number;
    }

    export interface BLL {
        GetStatistic(zone_id: string): Promise<Statistic>;
        ListStatistic(group_id: string): Promise<any>;
        GetTotalRecordsByMonth(zone_id:string): Promise<any>;
        GetCountRecords30Days(zone_id: string): Promise<any>;
    }

    export interface DAL {
        GetStatistic(zone_id: string): Promise<any>;
        CountRecords(box_id: string, query?: CountQuery): Promise<any>;
        GetLastRecord(group_id: string): Promise<any>;
    }
}