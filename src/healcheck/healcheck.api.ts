import { format, formatDuration, intervalToDuration } from "date-fns";
import express from "express";
import os from "os";

export function NewHealCheckAPI() {
    const router = express.Router();

    router.get("", async (req, res) => {
        const cpus = os.cpus();
        // TODO: get free memmory and total memmorry
        const GB = 1024 ** 3;
        const MB = 1024 ** 2 * 10;
        const free_mem = Math.floor(os.freemem() / MB) / 100;
        const total_mem = Math.floor(os.totalmem() / GB);
        const used = Math.floor(((os.totalmem() - os.freemem()) / os.totalmem()) * 100);

        // TODO: get idle cpu cores
        const { user, system } = process.cpuUsage();
        const cpu_used = Math.floor((system * 100)/ user);

        // TODO: create healcheck info
        const duration = intervalToDuration({ start: 0, end: process.uptime() * 1e3 });
        const formatted = formatDuration(duration, {
            format: ["hours", "minutes", "seconds"],
            delimiter: ":"
          });
        const healcheck = {
            uptime: `${process.uptime()} { ${formatted} }`,
            cpus: {
                model: cpus[0].model || 'none',
                speed: `${cpus[0].speed}MHz` || 'none',
                cores: `${cpus.length} cores`,
                used: `${cpu_used}%`
            },
            mem: {
                swap: `${Math.floor(total_mem - free_mem)}GB/${total_mem}GB`,
                used: `${used}%`
            },
            message: "OK",
            timestamp: format(Date.now(), "yyyy/MM/dd - HH:mm")
        }
        try {
            res.json(healcheck);
        } catch(e) {
            healcheck.message = e;
            res.status(503).send();
        }
    })
    
    return router;
}