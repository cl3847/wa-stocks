import {Pool} from "pg";
import UserDAO from "./handlers/UserDAO";
import StockDAO from "./handlers/StockDAO";
import UserService from "./services/UserService";
import DAOs from "./models/DAOs";
import Services from "./models/Services";
import {initDb} from "./utils/createDatabase";
require('dotenv').config();

async function main() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    });

    const pc = await pool.connect();
    await initDb(pc);

    const daos: DAOs = {
        users: new UserDAO(),
        stocks: new StockDAO(),
    };

    const service: Services = {
        users: new UserService(daos, pool)
    };

    service;
    pc.release()
}

main();
