import Service from "../services/Service";
import config from "../../config";
import {Client, EmbedBuilder, TextChannel} from "discord.js"
import {diffBlock, dollarize, getDateStringETC, getTimeStringEST, PADDING} from "./helpers";
import Stock from "../models/stock/Stock";
import Price from "../models/Price";
import GameState from "../models/GameState";
import UserPortfolio from "../models/user/UserPortfolio";
import log from "./logger";
import Request from "../models/request/Request";

async function updatePriceBoard(client: Client) {
    try {
        const service = Service.getInstance();
        if (!config.bot.channels.info || !config.bot.messages.priceBoard || !config.bot.messages.leaderboard) return;
        const allStocks = await service.stocks.getAllStocks();
        const yesterdayPrices = await service.stocks.getAllYesterdayPrice();
        const allUserPortfolios = (await service.users.getAllUserPortfolios()).sort((a, b) => b.netWorth() - a.netWorth());
        const channel = await client.channels.fetch(config.bot.channels.info) as TextChannel;

        let messageLeaderboard;
        let messagePriceBoard;
        try {
            messagePriceBoard = await channel.messages.fetch(config.bot.messages.priceBoard);
            messageLeaderboard = await channel.messages.fetch(config.bot.messages.leaderboard);
        } catch (err) {
            await channel.send("PRICE BOARD MESSAGE");
            log.error("Created price board message, copy ID and paste into config.");
            process.exit(1);
        }

        const gameState = await service.game.getGameState();
        const bounties = await service.transactions.viewRequestPool(10);
        await messagePriceBoard.edit({
            content: "", embeds: [
                generateStockBoardEmbed(allStocks, yesterdayPrices, gameState)
            ]
        });
        await messageLeaderboard.edit({
            content: "", embeds: [
                generateTopBountiesEmbed(bounties),
                await generateLeaderboardEmbed(client, allUserPortfolios)
            ]
        });
    } catch(err) {
        log.error("Error updating price board message!")
    }
}

function generateTopBountiesEmbed(bounties: Request[]) {
    const desc = `Last Updated: <t:${Math.floor(Date.now() / 1000)}>\n` +
        diffBlock(`LEVEL ID - Bounty Amount`) + PADDING +
        diffBlock(bounties.map((r, i) => {
           return `${i+1}: $${dollarize(r.bounty)} - ${r.name} (${r.level_id}) `
        }).join('\n') || "All requests cleared.");
    return new EmbedBuilder()
        .setTitle('Top Level Request Bounties')
        .setDescription(desc)
        .setColor(config.colors.blue);
}

function generateStockBoardEmbed(allStocks: Stock[], yesterdayPrices: Price[], gameState: GameState) {
    let upDownAmount = 0;
    let desc = ``;
    allStocks.forEach(stock => {
        const yesterdayPrice = yesterdayPrices.find(p => p.ticker === stock.ticker);
        const priceDiff = stock.price - (yesterdayPrice ? yesterdayPrice.close_price : 0);
        const priceDiffPercent = priceDiff / (yesterdayPrice ? yesterdayPrice.close_price : 1);
        const percentDisplay = yesterdayPrice !== undefined ? (priceDiffPercent * 100).toFixed(2) : "N/A";

        desc += `${stock.ticker} - ${stock.name} - $${dollarize(stock.price)}\n${priceDiff >= 0 ? '+' : '-'}$${dollarize(Math.abs(priceDiff))} (${percentDisplay}%)\n`;
        upDownAmount += priceDiff >= 0 ? 1 : -1;
    });

    let marketStatus = "";
    switch (gameState.marketState) {
        case "open":
            marketStatus += "+ MARKET OPEN +";
            break;
        case "pre":
            marketStatus += "+ MARKET OPEN (PRE-MARKET) +";
            break;
        case "after":
            marketStatus += "+ MARKET OPEN (AFTER-HOURS) +";
            break;
        default:
            marketStatus += "- MARKET CLOSED -";
    }
    marketStatus += `\nCURRENT TIME: ${getTimeStringEST()} ET\n\nPre-Market: 4:00 AM to 9:30 AM ET\nHours: 9:30 AM to 4:00 PM ET\nAfter-Hours: 4:00 PM to 10:00 PM ET\n`;

    return new EmbedBuilder()
        .setTitle(`Stock Prices (${getDateStringETC()})`)
        .setDescription(`Last Updated: <t:${Math.floor(Date.now() / 1000)}>\n` + diffBlock(`${marketStatus}`) + diffBlock(`TICKER - Company Name - Price per share\n+$0.00 (0.00%) today's stock price change`) + PADDING + diffBlock(desc))
        .setColor(upDownAmount >= 0 ? config.colors.green : config.colors.red);
}

async function generateLeaderboardEmbed(client: Client, allUserPortfolios: UserPortfolio[]) {
    let upDownAmount = 0;
    let desc = ``;

    const start = allUserPortfolios.slice(0, config.bot.leaderboardSizeTop);
    const end = allUserPortfolios.slice(-config.bot.leaderboardSizeBottom);
    end.filter(u => !start.map(x => x.uid).includes(u.uid));
    const joined = start.concat(end);

    let i = 1;
    let shifted = false;
    for (let user of joined) {
        let username = "N/A";
        client.users.fetch(user.uid)
            .then(user => username = user.username)
            .catch(_ => username = "N/A");

        const {diff: totalPriceDiff, percent: totalPriceDiffPercent} = await user.getDayPortfolioChange();
        const percentDisplay = totalPriceDiffPercent !== null ? (totalPriceDiffPercent * 100).toFixed(2) : "N/A";
        desc += `${i}: ${username} - $${dollarize(user.netWorth())} ($${dollarize(user.portfolioValue())})\n${totalPriceDiff >= 0 ? '+' : '-'}$${dollarize(Math.abs(totalPriceDiff))} (${percentDisplay}%)\n`;
        i++;
        if (i > start.length && !shifted && end.length > 0) {
            desc += "\n...\n\n";
            i = allUserPortfolios.length - end.length + 1;
            shifted = true;
        }
        upDownAmount += totalPriceDiff >= 0 ? 1 : -1;
    }
    desc = diffBlock(`RANK: Username - Net Worth (Portfolio Value)\n+$0.00 (0.00%) today's portfolio value change`) + PADDING + diffBlock(desc);
    return new EmbedBuilder()
        .setTitle(`Net Worth Leaderboard (${getDateStringETC()})`)
        .setDescription(`Last Updated: <t:${Math.floor(Date.now() / 1000)}>\n` + desc)
        .setColor(upDownAmount >= 0 ? config.colors.green : config.colors.red);
}

export {updatePriceBoard};