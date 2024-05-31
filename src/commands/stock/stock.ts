import CommandType from "../../models/CommandType";
import {CacheType, ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";
import Service from "../../services/Service";
import {centsToDollars} from "../../utils/helpers";
import StockNotFoundError from "../../models/error/StockNotFoundError";

const command: CommandType = {
    data: new SlashCommandBuilder()
        .setName('stock')
        .setDescription('Looks up the information of a stock.')
        .addStringOption(option =>
            option
                .setName('ticker')
                .setDescription('The ticker of the stock')
                .setRequired(true)
                .addChoices(Service.stockTickerList.map(ticker => ({ name: ticker, value: ticker })))),
    async execute(interaction: ChatInputCommandInteraction<CacheType>) {
        const service = Service.getInstance();
        const ticker = interaction.options.getString('ticker', true);
        const stock = await service.stocks.getStock(ticker);
        if (!stock) throw new StockNotFoundError(ticker);
        await interaction.reply(`Stock: ${stock.ticker} - ${stock.name} - $${centsToDollars(stock.price)}`)
    },
};

module.exports = command;