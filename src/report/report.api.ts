import * as express from "express";
import { HttpParamValidators } from "../lib/http";
import { ReportNS } from "../report/report";

export function NewReportAPI(
  reportBLL: ReportNS.BLL,
) {
  const router = express.Router();

  router.get("/statistic", async (req, res) => {
    const zone_id = HttpParamValidators.MustBeString(req.query, 'zone_id')
    const docs = await reportBLL.ListStatistic(zone_id);
    res.json(docs);
  });

  router.get("/statistic/get", async (req, res) => {
    const group_id = HttpParamValidators.MustBeString(req.query, 'group_id')
    const docs = await reportBLL.GetStatistic(group_id)
    res.json(docs);
  });

  router.get("/total/month", async (req, res) => {
    const zone_id = HttpParamValidators.MustBeString(req.query, 'zone_id')
    const docs = await reportBLL.GetTotalRecordsByMonth(zone_id)
    res.json(docs);
  });

  router.get("/count/month", async (req, res) => {
    const zone_id = HttpParamValidators.MustBeString(req.query, 'zone_id')
    const docs = await reportBLL.GetCountRecords30Days(zone_id)
    res.json(docs);
  });

  return router;
}
