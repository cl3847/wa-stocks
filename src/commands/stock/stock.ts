import CommandType from "../../types/CommandType";
import {
    AttachmentBuilder,
    AutocompleteInteraction,
    CacheType,
    ChatInputCommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder
} from "discord.js";
import Service from "../../services/Service";
import {confirmedEmbed, diffBlock, dollarize, getStockLogo} from "../../utils/helpers";
import config from "config";
import Price from "../../models/Price";
import {createCandlestickStockImage} from "../../utils/graphing";
import log from "../../utils/logger";
import NewsPopulatedStock from "../../models/stock/NewsPopulatedStock";
import autocompleteStock from "../../autocomplete/autocompleteStock";
import UserStock from "../../models/user/UserStock";

const command: CommandType = {
    data: new SlashCommandBuilder()
        .setName('stock')
        .setDescription('Looks up the information of a stock.')
        .addStringOption(option =>
                option
                    .setName('ticker')
                    .setDescription('The ticker of the stock')
                    .setAutocomplete(true)
                    .setRequired(true),
        ),
    
    async autocomplete(int: AutocompleteInteraction) {
        await autocompleteStock(int)
    },

    async execute(interaction: ChatInputCommandInteraction<CacheType>) {
        const ticker = interaction.options.getString('ticker', true).toUpperCase();

        const service = Service.getInstance();
        const stock = await service.stocks.getStock(ticker);
        if (!stock) {
            await interaction.reply({embeds: [confirmedEmbed(diffBlock(`- LOOKUP FAILED -\nStock ${ticker} does not exist.`), config.colors.blue)]});
            return;
        }
        const yesterdayPrice = await service.stocks.getYesterdayPrice(ticker);
        const topShareholders = await service.stocks.getTopShareholders(ticker, config.bot.topShareholdersAmount);

        const embed = generateStockEmbed(stock, yesterdayPrice, topShareholders);

        const files: AttachmentBuilder[] = [];
        try {
            const image: Buffer = await createCandlestickStockImage(ticker);
            const chartAttachment = new AttachmentBuilder(image, {name: 'candlestick.png'});
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

const generateStockEmbed = (stock: NewsPopulatedStock, yesterdayPrice: Price | null, topShareholders: UserStock[]): EmbedBuilder => {
    const priceDiff = stock.price - (yesterdayPrice ? yesterdayPrice.close_price : 0);
    const priceDiffPercent = priceDiff / (yesterdayPrice ? yesterdayPrice.close_price : 1);

    const titleString = `${stock.name} Stock Information`;
    const percentDisplay = yesterdayPrice !== null ? (priceDiffPercent * 100).toFixed(2) : "N/A";
    const priceDiffString = `${priceDiff >= 0 ? '+' : '-'}$${dollarize(Math.abs(priceDiff))} (${percentDisplay}%) today`;

    const embed = new EmbedBuilder()
        .setTitle(titleString)
        .setDescription(diffBlock(`${stock.ticker} - $${dollarize(stock.price)} per share\n${priceDiffString}`))
        .setColor(priceDiff >= 0 ? config.colors.green : config.colors.red)
        .setTimestamp(new Date());

    if (stock.news.length > 0) {
        embed.addFields({
            name: "Recent News",
            value: stock.news.slice(0, config.bot.newsAmountTruncate).map(article => {
                //return `${article.message_link} - ${article.body.substring(0, 30)}...`;
                return `🔗 [${article.body.substring(0, config.bot.newsLengthTruncate)}${article.body.length > config.bot.newsLengthTruncate ? "..." : ""}](${article.message_link})`;
            }).join("\n")
        });
    }

    if (topShareholders.length > 0) {
        embed.addFields({
            name: "Top Shareholders",
                value: topShareholders.map((us, _) => {
                return `<@${us.uid}> - \`${us.quantity} share(s)\``;
            }).join("\n")
        });
    }

    return embed;
};

module.exports = command;