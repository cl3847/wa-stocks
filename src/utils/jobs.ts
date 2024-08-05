import * as cron from "node-cron";
import {updatePriceBoard} from "./priceBoard";
import config from "../../config";
import {chooseRandomStocks, stockPriceRandomWalk} from "./helpers";
import Service from "../services/Service";
import log from "./logger";
import {Client} from "discord.js"

function initJobs(client: Client) {
    infoRefresh('*/1 * * * *', client); // refresh info channel embed
    walkStocks(`*/${config.game.randomWalkInterval} * * * *`); // random walk stocks
    openMarket('31 9 * * *'); // open market (9:31 AM ET) every day
    closeMarket('01 22 * * *'); // close market (10:01 PM ET) every day
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

function openMarket(expression: string) {
    cron.schedule(expression, async () => { // open market
        const randomStocks = await chooseRandomStocks(Service.stockTickerList.length);
        // await Service.getInstance().stocks.synchronizeAllStockPrices();
        for (const stock of randomStocks) {
            await stockPriceRandomWalk(stock.ticker, 10 * config.game.randomWalkVolatility);
        }

        await Service.getInstance().game.updateGameState({isMarketOpen: true, marketState: "open"});
        log.info(`Market opened at ${new Date().toLocaleString()} ET`);
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

function closeMarket(expression: string) {
    cron.schedule(expression, async () => { // close market
        const randomStocks = await chooseRandomStocks(Service.stockTickerList.length);
        for (const stock of randomStocks) {
            await stockPriceRandomWalk(stock.ticker, config.game.randomWalkVolatility);
        }

        await Service.getInstance().game.updateGameState({isMarketOpen: false, marketState: "closed"});
        log.info(`Market closed at ${new Date().toLocaleString()} ET`);
    }, {timezone: "America/New_York"});
}

export {initJobs}