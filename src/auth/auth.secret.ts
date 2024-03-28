import { UserAuthNS } from "./auth";
import bcrypt from "bcryptjs";

export class AuthSecretPlainText implements UserAuthNS.SecretEncoder {
  name = "";
  async encode(plain: string) {
    return plain;
  }
  async compare(plain: string, secret) {
    return plain === secret;
  }
}

export class AuthSecretBcrypt implements UserAuthNS.SecretEncoder {
  constructor(private readonly salt = 10) {}
  name = "bcrypt";
  async encode(plain: string) {
    return bcrypt.hash(plain, this.salt);
  }
  async compare(plain: string, secret: string) {
    return bcrypt.compare(plain, secret);
  }
}
