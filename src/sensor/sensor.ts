import rand from "../lib/rand"
export namespace SensorNS {
    export interface Sensor {
        id: string;
        code: string;
        alias?: string;
        name: string;
        metrics: Array<string>;
        ctime: number;
        mtime: number;
        dtime?: number;
    }
    export interface CreateSensorParams {
        code: string;
        alias?: string;
        name: string;
    }

    export interface UpdateSensorParams {
        code?: string;
        alias?: string;
        name?: string;
    }
    export interface Metric {
        id: string;
        code: string;
        name: string;
        unit: string;
        alias?: string;
        range?: Range[];
        ctime: number;
        mtime: number;
        dtime?: number;
    }

    export interface Range {
        min: number;
        max: number;
        code: string;
    }
    export interface CreateMetricParams {
        alias?: string;
        unit: string;
        code: string;
        name: string;
        range?: Range[];
    }

    export interface UpdateMetricParams {
        unit?: string;
        code?: string;
        name?: string;
        range?: Range[];
    }

    export interface Record {
        t: number; // sensor metric timestamp in second
        c: number; // server create timestamp in millisecond
        [key: string]: number;
    }

    export interface QueryRecord {
        time?: [number, number]; // min and max time
        limit?: number;
        skip?: number;
    }

    export enum ExportType {
        Excel = "export_excel",
        CSV = "export_csv",
        Report = "report"
    }
    export interface BLL {
        // ListSensor(): Promise<Sensor[]>;
        // GetSensor(id: string): Promise<Sensor>;

        ListMetric(): Promise<Metric[]>;
        GetMetric(filter: object): Promise<Metric>;
        CreateMetric(params: CreateMetricParams): Promise<Metric>;
        UpdateMetric(id: string, params: UpdateMetricParams): Promise<Metric>;
        DeleteMetric(id: string): Promise<Metric>;

        ListRecord(box_id: string, query?: QueryRecord): Promise<Record[]>;
        CountRecord(box_id: string, query: QueryRecord): Promise<number>;
        AddRecord(box_id: string, record: Record): Promise<void>;

        ReportRecord(box_id: string, query: QueryRecord): Promise<any>;
        ListRecordByGroup(group_id: string, query: SensorNS.QueryRecord): Promise<Record[]>;
    }

    export interface DAL {
        // ListSensor(): Promise<Sensor[]>;
        // GetSensor(id: string): Promise<Sensor>;

        ListMetric(): Promise<Metric[]>;
        GetMetric(filter: object): Promise<Metric>;
        CreateMetric(metric: Metric): Promise<void>;
        UpdateMetric(params: Metric): Promise<void>;

        ListRecord(source: string, query?: QueryRecord): Promise<Record[]>;
        CountRecord(source: string, query: QueryRecord): Promise<number>;
        AddRecord(datasource: string, record: Record): Promise<void>;

        ReportRecord(source: string, query: QueryRecord): Promise<any>;
    }

    export const Errors = {
        ErrMetricNotFound: new Error("metric not found"),
        ErrMetricCodeExisted: new Error("metric code existed"),
        ErrMetricMustHaveCode: new Error("metric must have code"),
    }

    export const Generator = {
        NewMetricId: () => rand.uppercase(8)
    }

    export const Util = {
        RoundValue: (f: number) => Math.round(f * 100) / 100
    }
}

