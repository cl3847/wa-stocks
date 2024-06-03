import CommandType from "../../models/CommandType";
import {CacheType, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder} from "discord.js";
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
        .setTitle(`${stock.name} (${stock.ticker})`)
        .setDescription(`placeholder description`)
        .setColor(config.colors.green)
        .setThumbnail("https://i.imgur.com/AfFp7pu.png")
        .setImage("https://t4.ftcdn.net/jpg/06/46/48/39/360_F_646483996_FU8STGnemtNlh7eprlfh1fZtBmAW8lV2.jpg")
        .setTimestamp(new Date())
        .addFields(
            { name: '\u200B', value: '\u200B' },
            {name: 'Price', value: `\`\`\`$${centsToDollars(stock.price)}\n\`\`\``, inline: true},
            {name: 'Today\'s Change', value: `\`\`\`diff\n+0.67% (+$67.89)\n\`\`\``, inline: true},
        );
};

module.exports = command;