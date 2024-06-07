import CommandType from "../../models/CommandType";
import {AttachmentBuilder, CacheType, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder} from "discord.js";
import Service from "../../services/Service";
import {dollarize, diffBlock} from "../../utils/helpers";
import StockNotFoundError from "../../models/error/StockNotFoundError";
import Stock from "src/models/stock/Stock";
import config from "config";
import Price from "../../models/Price";
import * as fs from "fs";

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
        const {embed, file} = generateStockEmbed(stock, yesterdayPrice);
        await interaction.reply({embeds: [embed], files: file ? [file] : []})
    },
};

const generateStockEmbed = (stock: Stock, yesterdayPrice: Price | null) => {
    let thumbnail = 'https://i.imgur.com/AfFp7pu.png'; // TODO pop this out as a function
    let file;
    if (fs.existsSync('assets/stocks/' + stock.ticker + '.png')) {
        file = new AttachmentBuilder(`./assets/stocks/${stock.ticker}.png`, { name: `${stock.ticker}.png` });
        thumbnail = `attachment://${stock.ticker}.png`;
    }

    const priceDiff = stock.price - (yesterdayPrice ? yesterdayPrice.close_price : 0);
    const priceDiffPercent = priceDiff / (yesterdayPrice ? yesterdayPrice.close_price : 1);

    const titleString = `${stock.name} Stock Information`;
    const priceDiffString = `${priceDiff >= 0 ? '+' : '-'}$${dollarize(Math.abs(priceDiff))} (${(priceDiffPercent * 100).toFixed(2)}%) today`;

    return {
            embed: new EmbedBuilder()
            .setTitle(titleString)
            .setDescription(diffBlock(`${stock.ticker} - $${dollarize(stock.price)} per share\n${priceDiffString}`))
            .setColor(priceDiff >= 0 ? config.colors.green : config.colors.red)
            .setThumbnail(thumbnail)
            .setImage("https://t4.ftcdn.net/jpg/06/46/48/39/360_F_646483996_FU8STGnemtNlh7eprlfh1fZtBmAW8lV2.jpg")
            .setTimestamp(new Date()),
        file
    }
};

module.exports = command;