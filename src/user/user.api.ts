import * as express from "express";
import { HttpError, HttpStatusCodes, HttpParamValidators } from "../lib/http";
import { UserNS } from "../user/user";
import { UserAuthNS } from "../auth/auth";

export function NewUserAPI(
  userBLL: UserNS.BLL,
) {
  const router = express.Router();
  const roleType = Object.values(UserNS.Role);
  router.get("/list", async (req, res) => {
    const docs = await userBLL.ListUser();
    res.json(docs);
  });

  router.get("/get", async (req, res) => {
    if (req.query.id) {
      const id = HttpParamValidators.MustBeString(req.query,"id", 8);
      const doc = await userBLL.GetUser(id);
      res.json(doc);
    }

    if (req.query.username) {
      const username = HttpParamValidators.MustBeString(req.query, "username", 2);
      const doc = await userBLL.GetUserByUserName(username);
      res.json(doc);
    }

    if (req.query.phone) {
      const phone = HttpParamValidators.MustBeString(req.query, 'phone', 9);
      const doc = await userBLL.GetUserByPhone(phone);
      res.json(doc);
    }
  });

  router.post("/create", async (req, res) => {
    const username = HttpParamValidators.MustBeString(req.body, "username", 2);
    const full_name = HttpParamValidators.MustBeString(req.body, "full_name", 2);
    const role = HttpParamValidators.MustBeOneOf(req.body, "role", roleType);
    const phone = HttpParamValidators.MustBeString(req.body, "phone", 10);
    const groups = req.body.groups;
    const params: UserNS.CreateUserParams = {
      username,
      full_name,
      role,
      phone,
      groups
    };
    const user = await userBLL.CreateUser(params);
    res.json(user);
  });

  router.post("/update", async (req, res) => {
    const id = HttpParamValidators.MustBeString(req.query, "id", 8);
    const params: UserNS.UpdateUserParams = {} = req.body;
    const doc = await userBLL.UpdateUser(id, params);
    res.json(doc);
  });

  router.post("/delete", async (req, res) => {
    const id = HttpParamValidators.MustBeString(req.query, "id", 8);
    const doc = await userBLL.DeleteUser(id);
    res.json(doc);
  })

  return router;
}
