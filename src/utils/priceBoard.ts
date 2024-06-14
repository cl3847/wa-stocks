import Service from "../services/Service";
import config from "../../config";
import {Client, EmbedBuilder, TextChannel} from "discord.js"
import {dollarize, getDateStringETC, diffBlock} from "./helpers";
import Stock from "../models/stock/Stock";
import Price from "../models/Price";
import GameState from "../models/GameState";
import UserPortfolio from "../models/user/UserPortfolio";

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
            await generateLeaderboardEmbed(client, allUserPortfolios),
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

    let marketStatus;
    switch (gameState.marketState) {
        case "open":
            marketStatus = "+ MARKET OPEN +";
            break;
        case "pre":
            marketStatus = "+ MARKET OPEN (PRE-MARKET) +";
            break;
        case "after":
            marketStatus = "+ MARKET OPEN (AFTER-HOURS) +";
            break;
        default:
            marketStatus = "- MARKET CLOSED -";
    }
    marketStatus += `\nPre-Market: 4:00AM to 9:30AM ET\nHours: 9:30AM to 4:00PM ET\nAfter-Hours: 4:00PM to 8:00PM ET\n`;

    return new EmbedBuilder()
        .setTitle(`Stock Prices (${getDateStringETC()})`)
        .setDescription(`Last Updated: <t:${Math.floor(Date.now() / 1000)}>\n` + diffBlock(`${marketStatus}`) + diffBlock(`STOCK TICKER - Company Name - Price per share\n+$0.00 (0.00%) today's stock price change`) + diffBlock(desc))
        .setColor(upDownAmount >= 0 ? config.colors.green : config.colors.red);
}

async function generateLeaderboardEmbed(client: Client, allUserPortfolios: UserPortfolio[]) {
    let upDownAmount = 0;
    let desc = ``;
    let i = 1;
    for (let user of allUserPortfolios) {
        const {diff: totalPriceDiff, percent: totalPriceDiffPercent} = await user.getDayPortfolioChange();
        const percentDisplay = totalPriceDiffPercent ? (totalPriceDiffPercent * 100).toFixed(2) : "N/A";
        desc += `${i}: ${(await client.users.fetch(user.uid)).username} - $${dollarize(user.netWorth())} ($${dollarize(await user.portfolioValue())})\n${totalPriceDiff > 0 ? '+' : '-'}$${dollarize(Math.abs(totalPriceDiff))} (${percentDisplay}%)\n`;
        i++;
        upDownAmount += totalPriceDiff >= 0 ? 1 : -1;
    }
    desc = diffBlock(`RANK: Username - Net Worth (Portfolio Value)\n+$0.00 (0.00%) today's portfolio value change`) + diffBlock(desc);
    return new EmbedBuilder()
        .setTitle(`Net Worth Leaderboard (${getDateStringETC()})`)
        .setDescription(`Last Updated: <t:${Math.floor(Date.now() / 1000)}>\n` + desc)
        .setColor(upDownAmount >= 0 ? config.colors.green : config.colors.red);
}

export {updatePriceBoard};