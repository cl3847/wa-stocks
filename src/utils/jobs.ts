import * as cron from "node-cron";
import {updatePriceBoard} from "./priceBoard";
import config from "../../config";
import {chooseRandomStocks, stockPriceRandomWalk} from "./helpers";
import Service from "../services/Service";
import log from "./logger";
import {Client} from "discord.js"
import {assignCreditCards, assignRewards, updateRoles} from "./rewardsDistribution";

function initJobs(client: Client) {
    infoRefresh('*/1 * * * *', client); // refresh info channel embed
    walkStocks(`*/${config.game.randomWalkInterval} * * * *`); // random walk stocks
    openMarket('30 9 * * *', client); // open market (9:31 AM ET) every day
    closeMarket('00 22 * * *', client); // close market (10:01 PM ET) every day
    openPreMarket('00 2 * * *'); // open pre-market (2:00 AM ET) every day
    openAfterMarket('00 16 * * *'); // open after-market (4:00 PM ET) every day
}

function infoRefresh(expression: string, client: Client) {
    cron.schedule(expression, async () => {
        await updatePriceBoard(client)
    }); // update info channel
}

async function walkStocks(expression: string) {
    cron.schedule(expression, async () => { // random walk stocks
        const gameState = await Service.getInstance().game.getGameState();
        if (!gameState.isMarketOpen) return;

        const randomStocks = await chooseRandomStocks(config.game.randomWalkAmount);
        for (const stock of randomStocks) {
            await stockPriceRandomWalk(stock.ticker, config.game.randomWalkVolatility);
        }
    });
}

function openMarket(expression: string, client: Client) {
    cron.schedule(expression, async () => { // open market
        const randomStocks = await chooseRandomStocks(Service.stockTickerList.length);
        // await Service.getInstance().stocks.synchronizeAllStockPrices();
        for (const stock of randomStocks) {
            await stockPriceRandomWalk(stock.ticker, 10 * config.game.randomWalkVolatility);
        }

        await Service.getInstance().game.updateGameState({isMarketOpen: true, marketState: "open"});
        await updatePriceBoard(client);
        log.info(`Market opened at ${new Date().toLocaleString()} ET`);
    }, {timezone: "America/New_York"});
}

function closeMarket(expression: string, client: Client) {
    cron.schedule(expression, async () => { // close market
        const randomStocks = await chooseRandomStocks(Service.stockTickerList.length);
        for (const stock of randomStocks) {
            await stockPriceRandomWalk(stock.ticker, config.game.randomWalkVolatility);
        }

        const service = Service.getInstance();
        await service.game.updateGameState({isMarketOpen: false, marketState: "closed"});
        await updatePriceBoard(client);
        log.info(`Market closed at ${new Date().toLocaleString()} ET`);

        // market close operations
        log.info(`Starting to apply interest...`);
        await service.users.applyInterest();
        log.success(`Completed applying interest.`);

        log.info(`Starting to assign credit cards...`);
        await assignCreditCards();
        log.success(`Completed assigning cards.`);

        log.info(`Starting to update roles...`);
        await updateRoles(client);
        log.success(`Completed updating roles.`);

        log.info(`Starting to assign rewards...`);
        await assignRewards();
        log.success(`Completed assigning rewards.`);

    }, {timezone: "America/New_York"});
}

function openPreMarket(expression: string) {
    cron.schedule(expression, async () => { // open pre-market
        const randomStocks = await chooseRandomStocks(Service.stockTickerList.length);
        for (const stock of randomStocks) {
            await stockPriceRandomWalk(stock.ticker, 20 * config.game.randomWalkVolatility);
        }
        await Service.getInstance().stocks.synchronizeAllStockPrices();

        await Service.getInstance().game.updateGameState({isMarketOpen: true, marketState: "pre"});
        log.info(`Pre-market opened at ${new Date().toLocaleString()} ET`);
    }, {timezone: "America/New_York"});
}

function openAfterMarket(expression: string) {
    cron.schedule(expression, async () => { // open after-market
        await Service.getInstance().game.updateGameState({isMarketOpen: true, marketState: "after"});
        log.info(`After-market opened at ${new Date().toLocaleString()} ET`);
    }, {timezone: "America/New_York"});
}
export {initJobs}