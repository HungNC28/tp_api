import * as xlsx from "sheetjs-style";
import { Request, Response } from "express";

function formatColumn(workSheet: xlsx.WorkSheet, range: xlsx.Range, style: object, format?: string) {
    for (let C = range.s.c; C <= range.e.c; C++) {
        for (let R = range.s.r; R <= range.e.r; R++) {
            const cellref = xlsx.utils.encode_cell({ c: C, r: R });
            if (workSheet[cellref]) {
                workSheet[cellref].s = style;
                if (workSheet[cellref].t == "n") {
                    workSheet[cellref].z = format;
                }
            }
        }
    }
}

export function ExportExcel(req: Request, res: Response, data, header, workSheetName, file_name) {
    const workBook = xlsx.utils.book_new();
    data.unshift(...header);
    const workSheet = xlsx.utils.aoa_to_sheet(data);
    const range = xlsx.utils.decode_range(workSheet["!ref"]);
    workSheet["!cols"] = [{wpx : 120}];
    workSheet["!rows"] = [];
    //style table
    for (let i = 0; i <= range.e.c; i ++) {
        workSheet["!cols"].push({wpx : 120});
        workSheet["!rows"].push({hpx : 20});
    }
    //add header name
    const range_ws = { s: { c: 0, r: 5 }, e: { c: range.e.c, r: range.e.r } };
    const ws_style = {
        font: { sz: 12 },
        alignment: { horizontal: "right" },
        border: {
            top: { style: "medium" },
            bottom: { style: "medium" },
            left: { style: "medium" },
            right: { style: "medium" },
        }
    }
    formatColumn(workSheet, range_ws, ws_style);

    //format title
    const range_title = { s: { c: 0, r: 0 }, e: { c: range.e.c, r: 0 } };
    const title_style = {
        font: { sz: 14, bold: true },
    }
    formatColumn(workSheet, range_title, title_style);

    //format info
    const range_info = { s: { c: 0, r: 1 }, e: { c: 1, r: 3 } };
    const info_style = {
        font: { sz: 13, bold: true , italic: true},
    }
    formatColumn(workSheet, range_info, info_style);

    // style header
    const range_header = { s: { c: 0, r: 4 }, e: { c: range.e.c, r: 4 } };
    const header_style = {
        font: { sz: 12, bold: true },
        alignment: { horizontal: "right" },
        border: {
            top: { style: "medium" },
            right: { style: "medium" }
        }
    }
    formatColumn(workSheet, range_header, header_style);

    const A5 = { s : { c : 0, r : 4 }, e : {c : 0 , r : 4 } };
    const A5_style = {
        border: {
            top: { style: "medium" },
            right: { style: "medium" }
        }
    }

    formatColumn(workSheet, A5, A5_style);
    for (let i = 3; i <= range.e.c ; i = i + 3) {
        const header = { s : { c : i, r : 4 }, e : {c : i , r : 4 } };
        const style = {
            border: {
                top: { style: "medium" },
                right: { style: "medium" }
            }
        }
        //const cellref = xlsx.utils.encode_range(header);
        //console.log(cellref)
        formatColumn(workSheet, header, style);
    }
    xlsx.utils.book_append_sheet(workBook, workSheet, workSheetName);
    res.setHeader("Content-Disposition", `attachment; filename=${file_name}.xlsx`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    return res.status(200).end(xlsx.write(workBook, { bookType: "xlsx", type: "buffer" }));
}