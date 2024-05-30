import {Pool} from "pg";
import UserDAO from "./handlers/UserDAO";
import StockDAO from "./handlers/StockDAO";
import DAOs from "./models/DAOs";
import {initDb} from "./utils/createDatabase";
import log from "./utils/logger";
import Service from "./services/Service";
require('dotenv').config();

async function main() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        ssl: {
            rejectUnauthorized: false
        }
    });

    // test connection to database, and initialize tables if not created
    try {
        const pc = await pool.connect();
        log.success("Connected to Postgres database.")
        await initDb(pc);
        pc.release();
    } catch(err) {
        log.error(err.message);
        process.exit(1);
    }

    const daos: DAOs = {
        users: new UserDAO(),
        stocks: new StockDAO(),
    };

    Service.init(daos, pool);
}

main();