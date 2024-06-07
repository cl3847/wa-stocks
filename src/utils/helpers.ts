import Service from "../services/Service";
import StockNotFoundError from "../models/error/StockNotFoundError";
import config from "../../config";

function dollarize(cents: number) {
    return (cents / 100).toFixed(2);
}

function getDateStringETC() {
    const date = new Date();
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'America/New_York'});
}

function getETCComponents(): {year: number, month: number, date: number } {
    const dateString = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'numeric', day: 'numeric' });
    const [month, date, year] = dateString.split('/').map(Number);
    if (!year || !month || !date) throw new Error('Error parsing date components.');
    return { year, month, date };
}

function getETCComponentsPreviousDay(): { year: number, month: number, date: number } {
    const now = new Date();
    const previousDay = new Date(now.setDate(now.getDate() - 1));
    const dateString = previousDay.toLocaleString('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'numeric', day: 'numeric' });
    const [month, date, year] = dateString.split('/').map(Number);
    if (!year || !month || !date) throw new Error('Error parsing date components.');
    return { year, month, date };
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

    const rnd = Math.random();
    let change_percent = 2 * volatility * rnd;
    if (change_percent > volatility) change_percent -= (2 * volatility);
    const change_amount = stock.price * change_percent;
    let new_price = Math.floor(stock.price + change_amount);
    if (new_price < config.game.minimumStockPrice) new_price = config.game.minimumStockPrice;
    await service.stocks.updateStock(ticker, {price: new_price});
}

function diffBlock(s: string) {
    return `\`\`\`diff\n${s}\n\`\`\``;
}
export { dollarize, chooseRandomStocks, stockPriceRandomWalk, getDateStringETC, getETCComponents, getETCComponentsPreviousDay, diffBlock };