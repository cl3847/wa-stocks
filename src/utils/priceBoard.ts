import Service from "../services/Service";
import config from "../../config";
import {Client, EmbedBuilder, TextChannel} from "discord.js"
import {dollarize, getDateStringETC, diffBlock} from "./helpers";
import Stock from "../models/stock/Stock";
import Price from "../models/Price";
import UserPortfolio from "../models/user/UserPortfolio";
import GameState from "../models/GameState";

async function updatePriceBoard(client: Client) {
    const service = Service.getInstance();
    // TODO create function to create stockboard message if it doesn't exist
    // TODO add error handling
    if (!config.bot.channels.info || !config.bot.messages.priceBoard) return;
    const allStocks = await service.stocks.getAllStocks();
    const yesterdayPrices = await service.stocks.getAllYesterdayPrice();
    const allUserPortfolios = await service.users.getAllUserPortfolios();
    const channel = await client.channels.fetch(config.bot.channels.info) as TextChannel;
    const message = await channel.messages.fetch(config.bot.messages.priceBoard);
    const gameState = await service.game.getGameState();
    await message.edit({
        content: "", embeds: [
            await generateLeaderboardEmbed(client, allUserPortfolios, yesterdayPrices),
            generateStockBoardEmbed(allStocks, yesterdayPrices, gameState)
        ]
    });
}

function generateStockBoardEmbed(allStocks: Stock[], yesterdayPrices: Price[], gameState: GameState) {
    let upDownAmount = 0;
    let desc = ``;
    allStocks.forEach(stock => {
       const yesterdayPrice = yesterdayPrices.find(p => p.ticker === stock.ticker);
       const priceDiff = stock.price - (yesterdayPrice ? yesterdayPrice.close_price : 0);
       const priceDiffPercent = priceDiff / (yesterdayPrice ? yesterdayPrice.close_price : 1);

       desc += `${stock.ticker} - ${stock.name} - $${dollarize(stock.price)}\n${priceDiff >= 0 ? '+' : '-'}$${dollarize(Math.abs(priceDiff))} (${(priceDiffPercent * 100).toFixed(2)}%)\n`;
        upDownAmount += priceDiff >= 0 ? 1 : -1;
    });
    const marketStatus = gameState.isMarketOpen ? "+ MARKET OPEN +" : "- MARKET CLOSED -";
    return new EmbedBuilder()
        .setTitle(`Stock Prices (${getDateStringETC()})`)
        .setDescription(`Last Updated: <t:${Math.floor(Date.now() / 1000)}>\n` + diffBlock(`${marketStatus}\nHours: 9:30AM to 4:00PM ET`) + diffBlock(`TICKER - Company Name - Price per share\n+$0.00 (0.00%) price change today`) + diffBlock(desc))
        .setColor(upDownAmount >= 0 ? config.colors.green : config.colors.red);
}

async function generateLeaderboardEmbed(client: Client, allUserPortfolios: UserPortfolio[], yesterdayPrices: Price[]) {
    let desc = ``;
    let i = 1;
    for (let user of allUserPortfolios) {
        let totalPriceDiff = 0;
        let totalYesterdayPrice = 0;
        for (let hs of user.portfolio) {
            const yesterdayPrice = yesterdayPrices.find(p => p.ticker === hs.ticker);
            const priceDiff = (hs.price * hs.quantity - (yesterdayPrice ? yesterdayPrice.close_price * hs.quantity : 0));

            totalPriceDiff += priceDiff;
            totalYesterdayPrice += (yesterdayPrice ? yesterdayPrice.close_price * hs.quantity : 0);
        }
        const totalPriceDiffPercent = totalPriceDiff / (totalYesterdayPrice || 1);
        desc += diffBlock(`${i}: ${(await client.users.fetch(user.uid)).username} - $${dollarize(user.netWorth())}\n${totalPriceDiff > 0 ? '+' : '-'}$${dollarize(Math.abs(totalPriceDiff))} (${(totalPriceDiffPercent * 100).toFixed(2)}%)\n`);
        i++;
    }
    return new EmbedBuilder()
        .setTitle(`Net Worth Leaderboard (${getDateStringETC()})`)
        .setDescription(`Last Updated: <t:${Math.floor(Date.now() / 1000)}>\n` + desc)
        .setColor(config.colors.green);
}

export {updatePriceBoard};