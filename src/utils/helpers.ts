import Service from "../services/Service";
import StockNotFoundError from "../models/error/StockNotFoundError";
import config from "../../config";
import log from "./logger";

function centsToDollars(cents: number) {
    return (cents / 100).toFixed(2);
}

async function chooseRandomStocks(n: number) {
    const service = Service.getInstance();
    const allStocks = await service.stocks.getAllStocks();
    if (n > allStocks.length) n = allStocks.length;
    const shuffled = allStocks.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);

}

async function stockPriceRandomWalk(ticker: string, volatility: number) {
    const service = Service.getInstance();
    const stock = await service.stocks.getStock(ticker);
    if (!stock) throw new StockNotFoundError(ticker);

    log.info(`Starting random walk for ${ticker} with original price ${stock.price}...`);
    const rnd = Math.random();
    let change_percent = 2 * volatility * rnd;
    if (change_percent > volatility) change_percent -= (2 * volatility);
    const change_amount = stock.price * change_percent;
    let new_price = Math.round(stock.price + change_amount);
    if (new_price < config.game.minimumStockPrice) new_price = config.game.minimumStockPrice;
    await service.stocks.updateStock(ticker, {price: new_price});
    log.success(`Random walk for ${ticker} completed. New price: ${new_price}`);
}

export { centsToDollars, chooseRandomStocks, stockPriceRandomWalk };