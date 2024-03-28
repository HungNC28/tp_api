const Layer = require('express/lib/router/layer');

function isAsyncFunction(value) {
    return value[Symbol.toStringTag] === 'AsyncFunction';
}

Layer.prototype.handle_request = async function handle(req, res, next) {
    const fn = this.handle;
    switch (fn.length) {
        case 0:
            next();
            break;
        case 1:
            next();
            break;
        case 2:
            // (req, res) => {}
            try {
                if (isAsyncFunction(fn)) {
                    await fn(req, res);
                } else {
                    fn(req, res);
                }
                if (!res.headersSent) {
                    next();
                }
            } catch (err) {
                next(err);
            }
            break;
        case 3:
            // (req, res, next) => {}
            fn(req, res, next);
            break;
        default:
            next();
            break;
    }
};

import * as express from 'express';
import * as path from 'path';
import { Request, Response } from 'express';
export function ExpressStaticFallback(folder: string) {
    const handler = express.static(folder);
    const indexFile = path.join(folder, "index.html");
    return (req: Request, res: Response, next) => {
        const ext = path.extname(req.url);
        if (ext) {
            handler(req, res, next);
        } else {
            res.sendFile(indexFile);
        }
    };
}
