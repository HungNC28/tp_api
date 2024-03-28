import { FilterData } from "../ext/parse_data";
import { UserNS } from "../user/user";

export class UserBLLBase implements UserNS.BLL {
  constructor(private dal: UserNS.DAL) { }

  async init() { }

  async ListUser() {
    const docs = await this.dal.ListUser();
    const users = FilterData<UserNS.User>(docs);
    return users;
  }

  async GetUser(id: string) {
    const user = await this.dal.GetUser(id);
    if (!user) {
      throw UserNS.Errors.UserNotFound;
    }
    return user;
  }

  async GetUserByUserName(username: string) {
    const user = await this.dal.GetUserByUserName(username);
    if (!user) {
      throw UserNS.Errors.UserNameNotFound;
    }
    return user;
  }

  async GetUserByPhone(phone: string): Promise<UserNS.User> {
    const user = await this.dal.GetUserByPhone(phone);
    if (!user) {
      throw UserNS.Errors.UserNameNotFound;
    }
    return user;
  }

  async CreateUser(params: UserNS.CreateUserParams) {
    const now = Date.now();
    const user = {
      id: UserNS.Generator.NewUserId(),
      username: params.username,
      full_name: params.full_name,
      role : params.role,
      phone : params.phone,
      groups: params.groups,
      ctime: now,
      mtime: now,
    };
    await this.dal.CreateUser(user);
    return user;
  }

  async UpdateUser(id: string, params: UserNS.UpdateUserParams) {
    const user = await this.GetUser(id);
    const doc = {...user,...params}
    doc.mtime = Date.now();
    await this.dal.UpdateUser(doc);
    return doc;
  }

  async DeleteUser(id: string) {
    const doc = await this.GetUser(id);
    doc.dtime = Date.now();
    await this.dal.UpdateUser(doc);
    return doc;
  }
}
