import {DAOs} from "../models/interfaces";

class UserService {
    daos: DAOs;

    constructor(daos: DAOs) {
        this.daos = daos;
    }

    public getUser(uid: string): Promise<User | null> {
        return this.daos.users.getUser(uid);
    }

    public createUser(user: User): Promise<void> {
        return this.daos.users.createUser(user);
    }
}

export default UserService;
