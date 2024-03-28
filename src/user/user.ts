import rand from "../lib/rand";
export namespace UserNS {
    export interface User {
        id : string;
        username : string;
        full_name : string;
        role : Role;
        phone : string;
        zone_id?: string;
        groups: string[];
        zalo_id?: string;
        ctime : number;
        mtime : number;
        dtime? : number;
    }

    export enum Role {
        Admin = "admin",
        Monitor = "monitor" //readonly
    }

    export interface CreateUserParams {
        username : string;
        full_name : string;
        role : Role;
        phone : string;
        groups?: string[];
        zalo_id?: string;
    }

    export interface UpdateUserParams {
        full_name? : string;
        phone? : string;
        groups?: string[];
        zalo_id?: string;
    }

    export interface BLL {
        GetUser(id: string): Promise<User>;
        GetUserByUserName(username: string): Promise<User>;
        GetUserByPhone(phone: string): Promise<User>;
        ListUser(): Promise<User[]>;
        CreateUser(params: CreateUserParams): Promise<User>;
        UpdateUser(id: string, params: UpdateUserParams): Promise<User>;
        DeleteUser(id : string): Promise<User>;
    }

    export interface DAL {
        GetUser(id: string): Promise<User>;
        GetUserByUserName(username: string): Promise<User>;
        GetUserByPhone(phone: string): Promise<User>;
        ListUser(): Promise<User[]>;
        CreateUser(user: User): Promise<void>;
        UpdateUser(user: User): Promise<void>;
    }

    export const Errors = {
        UserNotFound: new Error("user not found"),
        UserNameNotFound: new Error("username not found"),
        ErrUsernameExisted: new Error("Username existed"),
    }

    export const Generator = {
        NewUserId: () => rand.uppercase(8),
    }
}