import User from "../models/user/User"
import DAOs from "../models/DAOs";
import {Pool} from "pg";
import UserPortfolio from "../models/user/UserPortfolio";

class UserService {
    private daos: DAOs;
    private pool: Pool;

    constructor(daos: DAOs, pool: Pool) {
        this.daos = daos;
        this.pool = pool;
    }

    public async getUser(uid: string): Promise<User | null> {
        const pc = await this.pool.connect();
        const res = this.daos.users.getUser(pc, uid);
        pc.release();
        return res;
    }

    public async createUser(user: User): Promise<void> {
        const pc = await this.pool.connect();
        const res = this.daos.users.createUser(pc, user);
        pc.release();
        return res;
    }

    public async getUserPortfolio(uid: string): Promise<UserPortfolio | null> {
        const pc = await this.pool.connect();
        const res = this.daos.users.getUserPortfolio(pc, uid);
        pc.release();
        return res;
    }
}

export default UserService;
