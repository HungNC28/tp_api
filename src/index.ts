import express from "express";
import cors from "cors";
import path from "path";
import "./ext/log";
import "./lib/express";
import { ReadConfig } from "./config";
import { MongoCommon } from "./lib/mongodb";
import { ZoneBLLBase } from "./zone/zone.bll";
import { ZoneDALMongo } from "./zone/zone.dal";
import { NewZoneAPI } from "./zone/zone.api";
import { NewSensorAPI } from "./sensor/sensor.api";
import { SensorDALMongo } from "./sensor/sensor.dal";
import { SensorBLLBase } from "./sensor/sensor.bll";
import { HttpErrorHandler } from "./ext/http_error_handler";
import { UserDALMongo } from "./user/user.dal";
import { UserBLLBase } from "./user/user.bll";
import { NewUserAPI } from "./user/user.api";
import { UserAuthDALMongo } from "./auth/auth.dal.mongo";
import { UserAuthBLLBase } from "./auth/auth.bll.base";
import { NewAuthAPI } from "./auth/auth.api";
import { NewPartnerAPI } from "./partner/partner.api";
import { NewHealCheckAPI } from "./healcheck/healcheck.api";
import { ReportDALMongo } from "./report/report.dal";
import { ReportBLLBase } from "./report/report.bll";
import { NewReportAPI } from "./report/report.api";
import { ExpressStaticFallback } from "./lib/express";
import { EncryptData } from "./ext/encrypt";

async function main() {
    const config = await ReadConfig();
    console.log(config);
    const client = await MongoCommon.Connect(config.database.db_url, { replica: false });
    console.log('connected to database');
    const database = client.db(config.database.db_name);
    //*********************************************************************//
    const zoneDAL = new ZoneDALMongo(database);
    await zoneDAL.init();
    const zoneBLL = new ZoneBLLBase(zoneDAL);
    await zoneBLL.init();

    const sensorDAL = new SensorDALMongo(database);
    const sensorBLL = new SensorBLLBase(sensorDAL, zoneBLL);

    const userDAL = new UserDALMongo(database);
    await userDAL.init();
    const userBLL = new UserBLLBase(userDAL);
    await userBLL.init();

    const authDAL = new UserAuthDALMongo(database);
    await authDAL.init();
    const authBLL = new UserAuthBLLBase(authDAL, userBLL);
    await authBLL.init();

    const reportDAL = new ReportDALMongo(database);
    await reportDAL.init();
    const reportBLL = new ReportBLLBase(reportDAL, zoneBLL);
    await reportBLL.init();
    //*********************************************************************//
    const app = express();
    app.disable("x-powered-by");
    app.use(express.json());
    app.use(cors());
    app.use("/api/healcheck/", NewHealCheckAPI())
    app.use("/api/zone/", NewZoneAPI(zoneBLL, authBLL));
    app.use("/api/user/", NewUserAPI(userBLL));
    app.use("/api/auth/", NewAuthAPI(authBLL));
    app.use("/api/sensor/", NewSensorAPI(sensorBLL, zoneBLL));
    app.use("/api/report/", NewReportAPI(reportBLL));
    app.use("/v1/partner/", NewPartnerAPI(sensorBLL, zoneBLL));
    //********************************************************************//
    // app.use(ExpressStaticFallback(config.app.dir));

    app.use("/api/status", async (req, res) => {
        res.json({ time: Date.now() })
    });

    app.use("/app", async (req, res, next) => {
        app.use(express.static(config.internal.dir));
        const indexFile = path.join(config.internal.dir, "index.html");
        res.sendFile(indexFile);
    });
    app.get("/", async (req ,res, next) => {
        app.use(express.static(config.app.dir));
        const indexFile = path.join(config.app.dir, "index.html");
        res.sendFile(indexFile);
    })

    app.use(HttpErrorHandler);
    console.log(`Listen on ${config.server.port}`);
    app.listen(config.server.port, "0.0.0.0", () => {
        const err = arguments[0];
        if (err) {
            console.log(err);
        }
    })
}
main().catch(err => console.log(err));
