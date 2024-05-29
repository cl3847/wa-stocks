import {Pool} from "pg";
import UserDAO from "./handlers/UserDAO";
import StockDAO from "./handlers/StockDAO";
import UserService from "./services/UserService";
import DAOs from "./models/DAOs";
import Services from "./models/Services";
import {initDb} from "./utils/createDatabase";
import User from "./models/user/User";
require('dotenv').config();

async function main() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    });

    await initDb(pool);

    const daos: DAOs = {
        users: new UserDAO(pool),
        stocks: new StockDAO(pool),
    };

    const service: Services = {
        users: new UserService(daos)
    };

    test(service);
}

async function test(service: Services) {
    const saya: User = {
        uid: "297798128340566016",
        balance: 1000
    };

    /*const ayup: Stock = {
        ticker: "AYUP",
        price: 100,
        multiplier: 1,
        name: "Ayupple Inc.",
        stock_ticker: "AAPL",
        stock_price: 100,
        last_price_update: 0
    };*/

    console.log(await service.users.getUser("297798128340566016"));
    await service.users.createUser(saya);
    console.log(await service.users.getUser("297798128340566016"));
}

main();
