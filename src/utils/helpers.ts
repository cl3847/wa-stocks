import Service from "../services/Service";
import StockNotFoundError from "../models/error/StockNotFoundError";
import {Client} from "discord.js"
import config from "../../config";
import fs from "fs";
import {AttachmentBuilder, EmbedBuilder, TextChannel} from "discord.js";
import log from "./logger";

const PADDING = "————————————————————————————————————————————\n";
const SHORT_PADDING = "———————————————————————————————————\n";
const EMBED_PADDING = "————————————————————————————————————————\n";

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

function formatDate(year: number, month: number, day: number): string {
    // Create a new Date object. Note that months are zero-indexed in JavaScript and TypeScript (0 = January, 11 = December)
    const date = new Date(year, month - 1, day);

    // Options for toLocaleDateString to format the date as 'Month day, Year'
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };

    // Format the date using toLocaleDateString with options
    return date.toLocaleDateString('en-US', options);
}

function getTimeStringEST() {
    // Create a new Date object for the current time
    const now = new Date();

    // Get the time in EST formatted as a string
    return now.toLocaleTimeString('en-US', {
        timeZone: 'America/New_York', // EST including handling for EDT automatically
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
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

function getStockLogo(ticker: string, filename: string = "logo.png"): AttachmentBuilder | null {
    if (fs.existsSync('assets/stocks/' + ticker + '.png')) {
        return new AttachmentBuilder(`./assets/stocks/${ticker}.png`, { name: filename });
    }
    return null;
}

function confirmedEmbed(text: string, color: `#${string}`) {
    return new EmbedBuilder()
        .setDescription(text)
        .setColor(color)
        .setTimestamp(new Date());
}

async function logToChannel(client: Client, text: string) {
    if (!config.bot.channels.log) return;
    const channel = await client.channels.fetch(config.bot.channels.log) as TextChannel;
    try {
        await channel.send(text)
    } catch (err) {
        log.error("Error logging event to log channel: " + text)
    }
}

export {
    dollarize,
    logToChannel,
    chooseRandomStocks,
    stockPriceRandomWalk,
    getDateStringETC,
    getETCComponents,
    getETCComponentsPreviousDay,
    diffBlock,
    getStockLogo,
    timestampToETCComponents,
    getNextMidnightTimestampET,
    PADDING,
    SHORT_PADDING,
    EMBED_PADDING,
    getTimeStringEST,
    formatDate,
    confirmedEmbed
};