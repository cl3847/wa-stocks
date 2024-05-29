import {Client} from "pg";
import UserDAO from "./handlers/UserDAO";
import StockDAO from "./handlers/StockDAO";
import UserService from "./services/UserService";
import DAOs from "./models/DAOs";
import Services from "./models/Services";
import {initDb} from "./utils/createDatabase";
import User from "./models/user/User";
require('dotenv').config();

async function main() {
    const postgres = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    postgres.connect()
        .then(() => console.log("Connected to Postgres"))
        .catch(err => {
            console.error("Error connecting to Postgres", err);
            process.exit(1);
        });

    await initDb(postgres);

    const daos: DAOs = {
        users: new UserDAO(postgres),
        stocks: new StockDAO(postgres),
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
