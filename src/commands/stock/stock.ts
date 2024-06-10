import CommandType from "../../models/CommandType";
import {AttachmentBuilder, CacheType, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder} from "discord.js";
import Service from "../../services/Service";
import {dollarize, diffBlock, getStockLogo} from "../../utils/helpers";
import StockNotFoundError from "../../models/error/StockNotFoundError";
import Stock from "src/models/stock/Stock";
import config from "config";
import Price from "../../models/Price";
import {createCandlestickStockImage} from "../../utils/graphing";
import log from "../../utils/logger";

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
        const ticker = interaction.options.getString('ticker', true);

        const service = Service.getInstance();
        const stock = await service.stocks.getStock(ticker);
        if (!stock) throw new StockNotFoundError(ticker);
        const yesterdayPrice = await service.stocks.getYesterdayPrice(ticker);

        const embed = generateStockEmbed(stock, yesterdayPrice);

        const files: AttachmentBuilder[] = [];
        try {
            const image: Buffer = await createCandlestickStockImage(ticker);
            const chartAttachment = new AttachmentBuilder(image, { name: 'candlestick.png' });
            files.push(chartAttachment);
            embed.setImage('attachment://candlestick.png');
        } catch {
            log.error('Error creating candlestick image for stock ' + ticker);
        }

        const stockLogo = getStockLogo(ticker);
        if (stockLogo) {
            files.push(stockLogo);
            embed.setThumbnail(`attachment://logo.png`);
        }

        await interaction.reply({embeds: [embed], files})
    },
};

const generateStockEmbed = (stock: Stock, yesterdayPrice: Price | null): EmbedBuilder => {
    const priceDiff = stock.price - (yesterdayPrice ? yesterdayPrice.close_price : 0);
    const priceDiffPercent = priceDiff / (yesterdayPrice ? yesterdayPrice.close_price : 1);

    const titleString = `${stock.name} Stock Information`;
    const priceDiffString = `${priceDiff >= 0 ? '+' : '-'}$${dollarize(Math.abs(priceDiff))} (${(priceDiffPercent * 100).toFixed(2)}%) today`;

    return new EmbedBuilder()
        .setTitle(titleString)
        .setDescription(diffBlock(`${stock.ticker} - $${dollarize(stock.price)} per share\n${priceDiffString}`))
        .setColor(priceDiff >= 0 ? config.colors.green : config.colors.red)
        .setTimestamp(new Date())
};

module.exports = command;