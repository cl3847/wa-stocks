import Service from "../services/Service";
import StockNotFoundError from "../models/error/StockNotFoundError";
import config from "../../config";
import fs from "fs";
import {AttachmentBuilder} from "discord.js";

const PADDING = "————————————————————————————————————————————\n";

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

function timestampToETCComponents(timestamp: number): { year: number, month: number, date: number } {
    const d = new Date(timestamp);
    const dateString = d.toLocaleString('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'numeric', day: 'numeric' });
    const [month, date, year] = dateString.split('/').map(Number);
    if (!year || !month || !date) throw new Error('Error parsing date components.');
    return { year, month, date };
}

function getNextMidnightTimestampET(year: number, month: number, day: number): number {
    // Create date object for given date, assuming it's in UTC
    const date = new Date(Date.UTC(year, month - 1, day));

    // Add one day
    date.setUTCDate(date.getUTCDate() + 1);

    // Set UTC time to what would be midnight Eastern Time, accounting for either standard or daylight saving time
    const etOffset = isDstObserved(date) ? -4 : -5; // Eastern Time offset from UTC (-4 for EDT, -5 for EST)
    date.setUTCHours(etOffset * -1, 0, 0, 0);

    // Convert to UTC milliseconds
    return date.getTime();
}

function isDstObserved(date: Date): boolean {
    // January and July dates to determine the standard time offset vs. the current offset
    const jan = new Date(date.getFullYear(), 0, 1); // January 1
    const jul = new Date(date.getFullYear(), 6, 1); // July 1

    // Standard time offset (should be the greatest absolute value)
    const standardOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());

    // Return true if current date offset is less than standard time offset
    return date.getTimezoneOffset() < standardOffset;
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

function getStockLogo(ticker: string): AttachmentBuilder | null {
    if (fs.existsSync('assets/stocks/' + ticker + '.png')) {
        return new AttachmentBuilder(`./assets/stocks/${ticker}.png`, { name: `logo.png` });
    }
    return null;
}

export { dollarize, chooseRandomStocks, stockPriceRandomWalk, getDateStringETC, getETCComponents, getETCComponentsPreviousDay, diffBlock, getStockLogo, timestampToETCComponents, getNextMidnightTimestampET, PADDING };