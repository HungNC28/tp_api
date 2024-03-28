import { FromMongoData, MongoDB, ToMongoData, MongoErrorCodes,} from "../lib/mongodb";
import { UserNS } from "./user";
  
export class UserDALMongo implements UserNS.DAL {
  constructor(private db: MongoDB) { }
  
  async init() {
    this.col_user.createIndex("username", { unique: true , background : true});
  }
  
  private col_user = this.db.collection("user");
  
  async ListUser() {
    const docs = await this.col_user.find().toArray();
      return FromMongoData.Many<UserNS.User>(docs);
    }
  
  async GetUser(id: string) {
    const doc = await this.col_user.findOne({ _id: id });
    return FromMongoData.One<UserNS.User>(doc);
  }
  
  async GetUserByUserName(username: string) {
    const doc = await this.col_user.findOne({ username: username });
    return FromMongoData.One<UserNS.User>(doc);
  }
  
  async GetUserByPhone(phone: string): Promise<UserNS.User> {
    const doc = await this.col_user.findOne({ phone });
    return FromMongoData.One<UserNS.User>(doc);
  }

  async CreateUser(user: UserNS.User) {
    try {
      const doc = ToMongoData.One(user);
      await this.col_user.insertOne(doc);
    } catch (err) {
      if (err.code === MongoErrorCodes.Duplicate) {
        throw UserNS.Errors.ErrUsernameExisted;
      } else {
        throw err;
      }
    }
  }
  
  async UpdateUser(user: UserNS.User) {
    const doc = ToMongoData.One(user);
    await this.col_user.updateOne({ _id: user.id }, { $set: doc });
  }
}
  