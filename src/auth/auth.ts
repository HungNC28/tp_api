import { UserNS } from "../user/user";

export namespace UserAuthNS {
    export type User = UserNS.User;

    export interface UserSecret {
        user_id: string;
        name: string;
        value: string;
        encode: string;
    }
    
    export interface UserSession {
        id: string;
        user_id: string;
    }

    export interface SecretEncoder {
        name: string;
        encode(plain: string): Promise<string>;
        compare(plain: string, secret: string): Promise<boolean>;
    }
    
    export interface BLL {
        GetUser(id: string): Promise<User>;
    
        SetPassword(user_id: string, password: string): Promise<void>;
        Login(username: string, password: string): Promise<UserSession>;
        GetUserSession(id: string): Promise<UserSession>;
    }
    
    
    export interface DAL {
        SaveUserSecret(value: UserSecret): Promise<void>;
        GetUserSecret(user_id: string, name: string): Promise<UserSecret>;
    
        CreateUserSession(session: UserSession): Promise<void>;
        GetUserSession(id: string): Promise<UserSession>;
    }
    
    export const Errors = {
        ErrUserHasNoLogin: new Error("user has no login"),
        ErrWrongPassword: new Error("wrong password"),
    }
}