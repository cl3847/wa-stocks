import Service from "../services/Service";
import config from "../../config";
import {Client, TextChannel} from "discord.js"
import {centsToDollars} from "./helpers";

async function updatePriceBoard(client: Client) {
    const service = Service.getInstance();
    // TODO create function to create stockboard message if it doesn't exist
    // TODO add error handling
    if (!config.bot.channels.info || !config.bot.messages.priceBoard) return;
    const allStocks = await service.stocks.getAllStocks();
    let newMessage = `**Stock Prices:**\n\t${allStocks.map(stock => `**${stock.ticker}** (${stock.name}): $${centsToDollars(stock.price)} (+0.00%)`).join("\n\t")}\nLast Updated: ${new Date().toLocaleString()}`;
    const channel = await client.channels.fetch(config.bot.channels.info) as TextChannel;
    const message = await channel.messages.fetch(config.bot.messages.priceBoard);
    await message.edit(newMessage);
}

export {updatePriceBoard};