import {Pool} from "pg";
import UserDAO from "./handlers/UserDAO";
import StockDAO from "./handlers/StockDAO";
import UserService from "./services/UserService";
import DAOs from "./models/DAOs";
import Services from "./models/Services";
import {initDb} from "./utils/createDatabase";
import log from "./utils/logger";
import TransactionService from "./services/TransactionService";
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

    const service: Services = {
        users: new UserService(daos, pool),
        transactions: new TransactionService(daos, pool),
    };

    service;
}

main();
