import rand from "../lib/rand";
import { SensorNS } from "../sensor/sensor";

export namespace ZoneNS {
    export interface Zone {
        id: string;
        code: string;
        name: string;
        detail: any;
        center: Location;
        ctime: number;
        mtime: number;
    }

    export interface CreateZoneParams {
        name: string;
        code: string;
        detail: any;
        center?: Location;
    }

    export interface UpdateZoneParams {
        name?: string;
        code?: string;
        detail?: any;
        center?: Location;
    }

    export interface BoxMetric {
        code: string;
        name?: string;
        metric?: string;
        lat?: number;
        lng?: number;
        warning1?: number;
        warning2?: number;
        warning3?: number;
    }

    interface Location {
        lat: number;
        lng: number;
    }

    export interface MissionGroup {
        name: string;
        unit: string;   //Đơn vị
        parameter: string; //Thông số
    }
    interface NoteGroup {
        //Nhiệm vụ công trình
        mission?: MissionGroup[];

        // Cấp công trình
        region?: string; // Khu vực
        city?: string; // Thành phố

        level?: string;     // Cấp công trình
        watering?: string;  // Tần suất tưới thiết kế %
        frequency_flood?: string; // Tần suất lũ thiết kế(%)
        frequency_flood_origin?: string; // Tần suất lũ kiểm tra(%)
        
        //Hồ chứa
        area?: string;  // Diện tích lưu vực (km2)
        water_rise_die?: string;    //Mực nước chết MNC
        water_rise_normal?: string;  //Mực nước dâng bình thường MNDBT (m)
        water_rise_hight?: string;  //Mực nước dâng gia cường MNDGC (P = 1,50%)
        capacity_rise_die?: string;     // Dung tích hồ ứng với MNC(10^6m3)
        capacity_rise_normal?: string;      // Dung tích hồ ứng với MNDBT(10^6m3)
        capacity_rise_hight?: string;      // Dung tích hồ ứng với MNDGC(10^6m3)
        area_rise_die?: string;     // Diện tích hồ ứng với MNC(Ha)
        area_rise_normal?: string;      // Diện tích hồ ứng với MNDBT(Ha)
        area_rise_hight?: string;      // Diện tích hồ ứng với MNDGC(Ha)

        //Đập chính
        structure?: string;     // Kết cấu đập
        elevation?: string;     //Cao trình đập
        height?: string;    // Chiều cao đập lớn nhất(m)
        longs?: string;     // Chiều dài đập(m)
        width?: string; // Bề rộng mặt đập(m)
        roof_coefficient_up?: string;   // Hệ số mái thượng lưu
        roof_coefficient_down?: string; // Hệ số mái hạ lưu

        //Tràn xả lũ
        structural_discharge_dam?: string;    // Đặc điểm cấu kết cấu tràn xả lũ
        format_discharge_dam?: string;   // Hình thức tràn
        elevation_discharge_dam?: string;   // Cao trình đập(m)
        width_discharge_dam?: string;   // Chiều rộng tràn nước(m)
        water_column_discharge_dam?: string;   //Cột nước tràn thiết kế(m)

        //Cống lấy nước
        structural_drain?: string;      // Đặc điểm kết cấu cống
        elevation_drain?: string;      // Cao trình cấu cống(m)
        opening_drain?: string;      // Khẩu diện cống(m)
        maximum_discharge_drain?: string;      // Lưu lượng xả max(m3/s);

        //Tràn sự cố
        structural_incident?: string;      // Đặc điểm kết cấu tràn sự cố
        elevation_incident?: string;      // Cao trình ngưỡng tràn(m)
        bottom_width_incident?: string;      // Bề rộng đáy kênh tràn(m)
        roof_coefficient_incident?: string;     // Hệ số mái kênh tràn
        water_column_incident?: string;     // Cột nước tràn thiết kế(m)

        //Nhà quản lý
        structural_manage?: string;     // Kết cấu nhà quản lý
        area_manage?: string;       // Diện tích phòng quản lý (m2)
        quantity_manage?:  string;  // Số phòng
    }
    export interface BoxGroup {
        id: string;
        name: string;
        sort_order: number;
        zone_id: string;
        center?: { lat: number, lng: number };
        zoom?: number; //10-16
        cameras?: Array<string>;
        note?: NoteGroup;
        ctime: number;
        mtime: number;
        dtime?: number;
        subdomain?: string;
    }

    // export interface MapBoundary {
    //     center: {lat : number, lng : number};
    //     zoom : number; //10-16
    // }

    export interface CreateGroupParams {
        name: string;
        zone_id: string;
        center?: { lat: number, lng: number };
        zoom?: number; //10-16
        cameras?: Array<string>;
        subdomain?: string;
    }

    export interface UpdateGroupParams {
        name?: string;
        sort_order?: number;
        center?: { lat: number, lng: number };
        zoom?: number; //10-16
        cameras?: Array<string>;
        subdomain?: string;
    }

    export interface ViewBox extends BoxGroup {
        boxs: Array<Box>;
        total?: number
    }

    export interface Box {
        id: string;
        name: string;
        desc: string;
        group_id: string;
        sort_order: number;
        zone_id: string;
        location: Location;
        device_id: string;
        metrics: BoxMetric[];
        type?: string;
        ctime: number;
        mtime: number;
        dtime?: number;
    }

    export interface CreateBoxParams {
        name: string;
        group_id: string;
        zone_id: string;
        location: Location;
        device_id: string;
        metrics: BoxMetric[];
        desc: string;
        type?: string;
    }

    export interface UpdateBoxParams {
        name?: string;
        desc?: string;
        type?: string;
        group_id?: string;
        sort_order?: number;
        location?: Location;
        device_id?: string;
        metrics?: BoxMetric[];
    }

    export interface FilterBoxParams {
        group_id?: string;
    }
    export interface Report {
        info: {
            month: number,
            year: number,
            metric: string;
        }
        count: number;
        total: number
    }

    export enum ViewListGroup {
        Normal = "normal",
    }
    export interface BLL {
        ListZone(): Promise<Zone[]>;
        GetZone(id: string): Promise<Zone>;
        CreateZone(params: CreateZoneParams): Promise<Zone>;
        UpdateZone(id: string, params: UpdateZoneParams): Promise<Zone>;

        ListBox(filter: FilterBoxParams): Promise<Box[]>;
        GetBox(id: string): Promise<Box>;
        CreateBox(params: CreateBoxParams): Promise<Box>;
        UpdateBox(id: string, params: UpdateBoxParams): Promise<Box>;
        DeleteBox(id: string): Promise<Box>;
        FindGroup(id : string): Promise<BoxGroup>;

        ListGroup(zone_id: string): Promise<ViewBox[]>;
        GetGroup(id: string): Promise<ViewBox>;
        CreateGroup(params: CreateGroupParams): Promise<BoxGroup>;
        UpdateGroup(id: string, params: UpdateGroupParams): Promise<ViewBox>;
        DeleteGroup(id: string): Promise<BoxGroup>;

        ReportByMetric(box_group: string, metrics: Array<string>): Promise<Report[]>;
    }

    export interface DAL {
        ListZone(): Promise<Zone[]>;
        GetZone(id: string): Promise<Zone>;
        CreateZone(zone: Zone): Promise<void>;
        UpdateZone(zone: Zone): Promise<void>;

        ListBox(filter: FilterBoxParams): Promise<Box[]>;
        GetBox(id: string): Promise<Box>;
        CreateBox(box: Box): Promise<void>;
        UpdateBox(box: Box): Promise<void>;

        ListGroup(zone_id: string): Promise<BoxGroup[]>;
        GetGroup(id: string): Promise<BoxGroup>;
        CreateGroup(box_group: BoxGroup): Promise<void>;
        UpdateGroup(box_group: BoxGroup): Promise<void>;

        ReportByMetric(sources: Array<string>, metrics: Array<string>): Promise<Report[]>;
    }

    export const Errors = {
        ErrZoneNotFound: new Error("zone not found"),
        ErrZoneCodeExisted: new Error("zone code existed"),
        ErrBoxNotFound: new Error("box not found"),
        ErrBoxDeviceExisted: new Error("box device existed"),
        ErrBoxGroupNotFound: new Error("box group not found"),
        ErrBoxGroupExisted: new Error("box group existed")
    }

    export const Generator = {
        NewZoneId: () => rand.uppercase(8),
        NewBoxId: () => rand.uppercase(8),
        NewBoxGroupId: () => rand.uppercase(8),
    }
    interface Sortable {
        sort_order: number;
    }

    export const Util = {
        Sort(arr: Sortable[]) {
            return arr.sort((a, b) => a.sort_order < b.sort_order ? -1 : 1);
        },
        Max(arr: Sortable[], fallback?: number) {
            return Math.max(...arr.map(a => a.sort_order)) || fallback;
        },
        RoundValue: (f: number) => Math.round(f * 100) / 100,
    }   
}
