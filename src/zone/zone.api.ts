import * as express from "express";
import { UserAuthNS } from "../auth/auth";
import { NewAuthMiddleware } from "../auth/auth.api.middleware";
import { HttpParamValidators } from "../lib/http";
import { ZoneNS } from "./zone";

export function NewZoneAPI(zoneBLL: ZoneNS.BLL, authBLL: UserAuthNS.BLL) {
    const router = express.Router();
    router.get("/list", async (req, res) => {
        const docs = await zoneBLL.ListZone();
        res.json(docs);
    });

    router.get("/get", async (req, res) => {
        const id = HttpParamValidators.MustBeString(req.query, "id", 8);
        const doc = await zoneBLL.GetZone(id);
        res.json(doc);
    });

    router.post("/create", async (req, res) => {
        HttpParamValidators.MustBeString(req.body, "name");
        HttpParamValidators.MustBeString(req.body, "code");
        const doc = await zoneBLL.CreateZone(req.body);
        res.json(doc);
    });

    router.post("/update", async (req, res) => {
        const id = HttpParamValidators.MustBeString(req.query, "id", 8);
        const doc = await zoneBLL.UpdateZone(id, req.body);
        res.json(doc);
    });
    // app.use(NewAuthMiddleware(authBLL));
    router.get("/box/list", async (req, res) => {
        let filter: ZoneNS.FilterBoxParams = {};
        if (req.query.group_id) {
            filter.group_id = req.query.group_id as string;
        }
        const docs = await zoneBLL.ListBox(filter);
        ZoneNS.Util.Sort(docs);
        res.json(docs);
    });

    router.get("/box/get", async (req, res) => {
        const id = HttpParamValidators.MustBeString(req.query, "id", 8);
        const doc = await zoneBLL.GetBox(id);
        res.json(doc);
    });

    router.post("/box/create", async (req, res) => {
        HttpParamValidators.MustBeString(req.body, "name");
        HttpParamValidators.MustBeString(req.body, "zone_id");
        HttpParamValidators.MustBeString(req.body, "group_id");
        HttpParamValidators.MustBeString(req.body, "device_id");
        if (req.body.type) HttpParamValidators.MustBeString(req.body, "type");
        const doc = await zoneBLL.CreateBox(req.body);
        res.json(doc);
    });

    router.post("/box/update", async (req, res) => {
        const id = HttpParamValidators.MustBeString(req.query, "id", 8);
        const params: ZoneNS.UpdateBoxParams = req.body;
        const doc = await zoneBLL.UpdateBox(id, params);
        res.json(doc);
    });

    router.post("/box/delete", async (req, res) => {
        const id = HttpParamValidators.MustBeString(req.query, "id", 8);
        const doc = await zoneBLL.DeleteBox(id);
        res.json(doc);
    });

    router.get("/box_group/list", async (req, res) => {
        const zone_id = HttpParamValidators.MustBeString(
            req.query,
            "zone_id",
            6
        );
        const docs = await zoneBLL.ListGroup(zone_id);
        ZoneNS.Util.Sort(docs);
        res.json(docs);
    });

    router.get("/box_group/get", async (req, res) => {
        const id = req.query.id as string;
        const doc = await zoneBLL.GetGroup(id);
        res.json(doc);
    });

    router.post("/box_group/create", async (req, res) => {
        const params: ZoneNS.CreateGroupParams = {
            name: req.body.name,
            ...req.body,
        };
        const doc = await zoneBLL.CreateGroup(params);
        res.json(doc);
    });

    router.post("/box_group/update", async (req, res) => {
        const id = req.query.id as string;
        const params: ZoneNS.UpdateGroupParams = req.body;
        const doc = await zoneBLL.UpdateGroup(id, params);
        res.json(doc);
    });

    router.post("/box_group/delete", async (req, res) => {
        const id = req.query.id as string;
        const doc = await zoneBLL.DeleteGroup(id);
        res.json(doc);
    });

    router.get("/report", async (req, res) => {
        const box_group_id = HttpParamValidators.MustBeString(
            req.query,
            "box_group",
            8
        );
        // compute rain (RA) and water upstream ( WAU ) with box_group_id
        const metrics = req.query.metrics
            ? (req.query.metrics as string).includes(",")
                ? (req.query.metrics as string).split(",")
                : ([req.query.metrics] as Array<string>)
            : ["RA", "WAU"];
        const docs = await zoneBLL.ReportByMetric(box_group_id, metrics);
        res.json(docs);
    });

    return router;
}
