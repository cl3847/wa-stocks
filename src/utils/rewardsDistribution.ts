import Service from "../services/Service";
import {Pool, types} from "pg";
import log from "./logger";
import {initDb} from "./createDatabase";
import DAOs from "../models/DAOs";
import UserDAO from "../handlers/UserDAO";
import StockDAO from "../handlers/StockDAO";
import TransactionDAO from "../handlers/TransactionDAO";
import ObjectDAO from "../handlers/ObjectDAO";
import ItemDAO from "../handlers/ItemDAO";
import Item from "../models/item/Item";
import MissingCreditCardError from "../models/error/MissingCreditCardError";
import config from "../../config";

const rewardConfig = {
    cardDistribution: [
        {group: 0.25, item: "020", limitBump: 10000000, weeklyRewards: [{item: "900", quantity: 2}]},
        {group: 0.5, item: "010", limitBump: 5000000, weeklyRewards: [{item: "900", quantity: 1}]},
        {group: 1,   item: "000", limitBump: 0, weeklyRewards: []},
    ]
}

async function assignCreditCards() {
    const service = Service.getInstance();
    const users = await service.users.getAllUserPortfolios();
    const updated= [];
    for (let i = 0; i < users.length; i++) {
        const user = users[i]!;
        let newCardId = rewardConfig.cardDistribution[rewardConfig.cardDistribution.length - 1]!.item;
        for (let j = 0; j < rewardConfig.cardDistribution.length; j++) {
            if (i < users.length * rewardConfig.cardDistribution[j]!.group && user.netWorth() > config.game.startingBalance) {
                newCardId = rewardConfig.cardDistribution[j]!.item;
                break;
            }
        }
        try {
            const isUpdated = await service.users.updateCreditCard(user.uid, newCardId);
            if (isUpdated) updated.push(user.uid);
        } catch (err) {
            log.error(`Could not update ${user.uid}'s credit card to ${newCardId}`);
        }
    }
    return updated;
}

async function assignRewards() {
    const service = Service.getInstance();
    const users = await service.users.getAllUserPortfolios();
    for (let user of users) {
        const inventory = await service.users.getUserInventory(user.uid);
        const currentCard = inventory.find((x: Item) => x.type === "credit_card");
        if (!currentCard) throw new MissingCreditCardError(user.uid);

        const myCardRewards = rewardConfig.cardDistribution.find(x => x.item === currentCard.item_id);
        if (!myCardRewards) continue;
        const cli = myCardRewards.limitBump;
        const newItems: {item: string, quantity: number}[] = myCardRewards.weeklyRewards;
        try {
            await service.users.updateUser(user.uid, {credit_limit: user.credit_limit + cli});
            log.success(`Increased ${user.uid}'s credit limit from ${user.credit_limit } to ${user.credit_limit + cli}`);
            for (let item of newItems) {
                let currentItem = (await service.users.getItemHolding(user.uid, item.item));
                if (!currentItem) {
                    await service.users.createItemHolding({uid: user.uid, item_id: item.item, quantity: item.quantity});
                } else {
                    await service.users.updateItemHolding(user.uid, item.item, {quantity: currentItem.quantity + item.quantity})
                }
                log.success(`Gave ${user.uid} ${item.quantity} of ${item.item}`);
            }
        } catch (err) {
            log.error(`Failed to apply rewards to ${user.uid}: ` + err);
        }

    }
}
/*
async function updateRole() {

}*/

(async () => {

// create database connection pool
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        ssl: {
            rejectUnauthorized: false
        }
    });

    types.setTypeParser(20, (val) => parseInt(val, 10)); // parse int8 as number

// test connection to database, and initialize tables if not created
    try {
        const pc = await pool.connect();
        log.success("Connected to Postgres database.");
        await initDb(pc);
        pc.release();
    } catch (err) {
        log.error(err.message);
        process.exit(1);
    }

    // initialize DAOs and Services
    const daos: DAOs = {
        users: new UserDAO(),
        stocks: new StockDAO(),
        transactions: new TransactionDAO(),
        objects: new ObjectDAO(),
        items: new ItemDAO(),
    };
    await Service.init(daos, pool);
})();
