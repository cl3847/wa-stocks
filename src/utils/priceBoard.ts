import Service from "../services/Service";
import config from "../../config";
import {Client, TextChannel} from "discord.js"
import {centsToDollars, getDateStringETC} from "./helpers";
import Stock from "../models/stock/Stock";
import Price from "../models/Price";

async function updatePriceBoard(client: Client) {
    const service = Service.getInstance();
    // TODO create function to create stockboard message if it doesn't exist
    // TODO add error handling
    if (!config.bot.channels.info || !config.bot.messages.priceBoard) return;
    const allStocks = await service.stocks.getAllStocks();
    const yesterdayPrices = await service.stocks.getYesterdayPrices();
    const channel = await client.channels.fetch(config.bot.channels.info) as TextChannel;
    const message = await channel.messages.fetch(config.bot.messages.priceBoard);
    await message.edit(generateStockBoardMessage(allStocks, yesterdayPrices));
}

function generateStockBoardMessage(allStocks: Stock[], yesterdayPrices: Price[]) {
    let newMessage = `**Stock Prices (${getDateStringETC()}):**\n\`\`\`diff\n`;
    allStocks.forEach(stock => {
       const yesterdayPrice = yesterdayPrices.find(p => p.ticker === stock.ticker);
       const priceDiff = stock.price - (yesterdayPrice ? yesterdayPrice.price : 0);
       const priceDiffPercent = priceDiff / (yesterdayPrice ? yesterdayPrice.price : 1);
       newMessage += `${stock.ticker} - ${stock.name} - $${centsToDollars(stock.price)}\n${priceDiff > 0 ? '+' : '-'}$${centsToDollars(Math.abs(priceDiff))} (${(priceDiffPercent * 100).toFixed(2)}%)\n`;
    });
    newMessage += `\n\`\`\`\nLast Updated: <t:${Math.floor(Date.now() / 1000)}>\n`;
    newMessage += `Market Hours: **9:30AM to 4:00PM ET, Mon-Fri**. (<t:${1717421400}:t> to <t:${1717444800}:t>)\n`;
    return newMessage;
}

export {updatePriceBoard};