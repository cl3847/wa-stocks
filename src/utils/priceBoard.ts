import Service from "../services/Service";
import config from "../../config";
import {Client, EmbedBuilder, TextChannel} from "discord.js"
import {centsToDollars, getDateStringETC, stringToDiffBlock} from "./helpers";
import Stock from "../models/stock/Stock";
import Price from "../models/Price";

async function updatePriceBoard(client: Client) {
    const service = Service.getInstance();
    // TODO create function to create stockboard message if it doesn't exist
    // TODO add error handling
    if (!config.bot.channels.info || !config.bot.messages.priceBoard) return;
    const allStocks = await service.stocks.getAllStocks();
    const yesterdayPrices = await service.stocks.getAllYesterdayPrice();
    const channel = await client.channels.fetch(config.bot.channels.info) as TextChannel;
    const message = await channel.messages.fetch(config.bot.messages.priceBoard);
    await message.edit({content: "", embeds: [generateStockBoardEmbed(allStocks, yesterdayPrices)]});
}

function generateStockBoardEmbed(allStocks: Stock[], yesterdayPrices: Price[]) {
    let upDownAmount = 0;
    let desc = ``;
    allStocks.forEach(stock => {
       const yesterdayPrice = yesterdayPrices.find(p => p.ticker === stock.ticker);
       const priceDiff = stock.price - (yesterdayPrice ? yesterdayPrice.price : 0);
       const priceDiffPercent = priceDiff / (yesterdayPrice ? yesterdayPrice.price : 1);
       desc += `${stock.ticker} - ${stock.name} - $${centsToDollars(stock.price)}\n${priceDiff >= 0 ? '+' : '-'}$${centsToDollars(Math.abs(priceDiff))} (${(priceDiffPercent * 100).toFixed(2)}%)\n`;
        upDownAmount += priceDiff >= 0 ? 1 : -1;
    });
    return new EmbedBuilder()
        .setTitle(`Stock Prices (${getDateStringETC()})`)
        .setDescription(`Last Updated: <t:${Math.floor(Date.now() / 1000)}>\n` + stringToDiffBlock(`+ MARKET OPEN +\nHours: 9:30AM to 4:00PM ET`) + stringToDiffBlock(desc))
        .setColor(upDownAmount >= 0 ? config.colors.green : config.colors.red);
}

export {updatePriceBoard};