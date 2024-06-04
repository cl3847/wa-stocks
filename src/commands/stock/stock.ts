import CommandType from "../../models/CommandType";
import {CacheType, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder} from "discord.js";
import Service from "../../services/Service";
import {centsToDollars, stringToDiffBlock} from "../../utils/helpers";
import StockNotFoundError from "../../models/error/StockNotFoundError";
import Stock from "src/models/stock/Stock";
import config from "config";
import Price from "../../models/Price";

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
        const yesterdayPrice = await service.stocks.getYesterdayPrice(ticker);
        await interaction.reply({embeds: [generateStockEmbed(stock, yesterdayPrice)]})
    },
};

const generateStockEmbed = (stock: Stock, yesterdayPrice: Price | null) => {
    const priceDiff = stock.price - (yesterdayPrice ? yesterdayPrice.price : 0);
    const priceDiffPercent = priceDiff / (yesterdayPrice ? yesterdayPrice.price : 1);

    return new EmbedBuilder()
        .setTitle(`${stock.name} (${stock.ticker})`)
        .setDescription(`placeholder description`)
        .setColor(config.colors.green)
        .setThumbnail("https://i.imgur.com/AfFp7pu.png")
        .setImage("https://t4.ftcdn.net/jpg/06/46/48/39/360_F_646483996_FU8STGnemtNlh7eprlfh1fZtBmAW8lV2.jpg")
        .setTimestamp(new Date())
        .addFields(
            { name: '\u200B', value: '\u200B' },
            {name: 'Price', value: `\`\`\`$${centsToDollars(stock.price)}\n\`\`\``, inline: true},
            {name: 'Today\'s Change', value: stringToDiffBlock(`${priceDiff >= 0 ? '+' : '-'}$${centsToDollars(Math.abs(priceDiff))} (${(priceDiffPercent * 100).toFixed(2)}%)`), inline: true},
        );
};

module.exports = command;