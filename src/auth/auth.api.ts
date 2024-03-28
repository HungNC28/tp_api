import express from 'express';
import { HttpError, HttpStatusCodes, HttpParamValidators } from "../lib/http";
import { UserAuthNS } from './auth';
import { NewAuthMiddleware, GetAuthData } from './auth.api.middleware';
import { UserNS } from '../user/user';
import { ReadConfig } from '../config';
import path from 'path';

export function NewAuthAPI(
    userAuthBLL: UserAuthNS.BLL,
) {
    const router = express.Router();
    
    // router.get("/internal", async (req, res, next) => {

    //     const config = await ReadConfig();
    //     const indexFile = path.join(config.internal.dir, "index.html");
    //     console.log(indexFile, "file");
    //     res.sendFile(indexFile);
    // })

    router.post("/login", async (req, res) => {
        const { username, password } = req.body;
        try {
            const session = await userAuthBLL.Login(username, password);
            res.json(session);
        } catch (e) {
            switch (e) {
                case UserNS.Errors.UserNameNotFound:
                case UserAuthNS.Errors.ErrWrongPassword:
                case UserAuthNS.Errors.ErrUserHasNoLogin:
                    throw new HttpError(e.message, HttpStatusCodes.Unauthorized);
                default:
                    throw e;
            }
        }
    });

    router.post("/user/set_password", async (req, res) => {
        const user_id = HttpParamValidators.MustBeString(req.body, 'id');
        const password = HttpParamValidators.MustBeString(req.body, 'password', 6);
        await userAuthBLL.SetPassword(user_id, password);
        res.json(1);
    });

    router.use(NewAuthMiddleware(userAuthBLL));
    router.get("/me", async (req, res) => {
        const session = GetAuthData(req);
        try {
            const user = await userAuthBLL.GetUser(session.user_id);
            res.json({ session, user });
        } catch (e) {
            if (e === UserNS.Errors.UserNotFound) {
                throw new HttpError(e.message, HttpStatusCodes.Unauthorized);
            } else {
                throw e;
            }
        }
    });
    router.get("/me/set_password", async (req, res) => {
        const session = GetAuthData(req);
        const password = HttpParamValidators.MustBeString(req.body, 'password', 6);
        await userAuthBLL.SetPassword(session.user_id, password);
        res.json(1);
    });

    const commonErrors = new Set([
        ...Object.values(UserAuthNS.Errors),
    ]);
    router.use((err: Error, req, res, next) => {
        if (commonErrors.has(err)) {
            err = new HttpError(err.message, HttpStatusCodes.BadRequest);
        }
        next(err);
    });
    return router;
}

