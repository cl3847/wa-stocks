import CommandType from "../../models/CommandType";
import {CacheType, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, User} from "discord.js";
import Service from "../../services/Service";
import {centsToDollars} from "../../utils/helpers";
import StockNotFoundError from "../../models/error/StockNotFoundError";
import Stock from "src/models/stock/Stock";
import config from "config";

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
        await interaction.reply({embeds: [generateStockEmbed(stock)]})
    },
};

const generateStockEmbed = (stock: Stock) => {
    return new EmbedBuilder()
        .setTitle(stock.name)
        .setDescription(`AYUPDAQ: ${stock.ticker}`)
        .setColor(config.colors.green)
        .setThumbnail("https://i.imgur.com/AfFp7pu.png")
        .setTimestamp(new Date())
        .addFields(
            { name: '\u200B', value: '\u200B' },
            {name: 'Price', value: `$${centsToDollars(stock.price)}`, inline: true},
            {name: 'Change', value: `+0.67`, inline: true},
            {name: 'Volume', value: `1,000`, inline: true},
        );
}

module.exports = command;