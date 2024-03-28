import { SensorNS } from "./sensor";
import { format } from "date-fns"; 

export async function ConvertCodeToNameMetric(array : Array<SensorNS.Record>, sensorBLL : SensorNS.BLL) {
    array.sort((a, b) => a.t - b.t);
    const docs = await Promise.all(array.map(async doc => {
        let new_doc = Object.entries(doc);
        const new_obj = await Promise.all(new_doc.map(async d => {
            if (d[0] === "t") {
                return ["Ngày", d[1]]
            } else if (d[0] === "c") {
                return ["c", d[1]]
            }
            const metric = await sensorBLL.GetMetric({ code: d[0] });
            if (!metric) {
                return [];
            }
            return [metric.name, d[1]];
        }))
        const data = Object.fromEntries(new_obj);
        delete data.c;
        delete data['undefined'];
        return data;
    }));
    
    if(array.length > 0 && Object.keys(array[0]).includes('RA')) {
        let total = +0;
        docs.forEach((d) => {
            if (new Date(d["Ngày"] * 1e3).getHours() === +8) total = +0;
            total += d["Lượng mưa"];
            d["Lượng mưa ngày"] = +total;
        })
    }
    return docs.reverse();
}

export async function ConvertDataExport(array: Array<any>) {
    const result = [];
    const header = Object.keys(array[0]);
    result.push(header);
    array.forEach(obj => {
        result.push(Object.values(obj))
    })
    return result;
}

export async function ConvertDataToAOA(array : Array<any>, sensorBLL : SensorNS.BLL) {
    const key = "t";
    const obj = {...array[0]};
    delete obj[key];
    const keys = Object.keys(obj).map(str => str.split("_")[0]).filter((el, index, array) => array.indexOf(el) === index);
    const metrics = await Promise.all(keys.map(async code => {
        const doc = await sensorBLL.GetMetric({ code });
        return doc.name;
    }));
    let [results, priHeaders, headers] = [[], [""], ["Ngày"]];
    metrics.forEach(k => {
        priHeaders.push("", k, "");
        headers.push("Cao" , "Thấp" , "Trung bình");
    });
    results.push(priHeaders);
    results.push(headers);
    array.forEach(obj => results.push(Object.values(obj)));
    return results;
}

type RecordModel = Pick<SensorNS.Record, Exclude<keyof SensorNS.Record, "c">>;
export function DeleteCtime(records : Array<SensorNS.Record>) : Array<RecordModel>{
    const newRecords = records.map(r => {
        delete r["c"];
        return r;
    })
    return newRecords;
}

export function CompareObject(objA, objB) : boolean {
    return JSON.stringify(objA) === JSON.stringify(objB);
}