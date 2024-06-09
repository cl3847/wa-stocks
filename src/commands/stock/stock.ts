import CommandType from "../../models/CommandType";
import {AttachmentBuilder, CacheType, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder} from "discord.js";
import Service from "../../services/Service";
import {dollarize, diffBlock} from "../../utils/helpers";
import StockNotFoundError from "../../models/error/StockNotFoundError";
import Stock from "src/models/stock/Stock";
import config from "config";
import Price from "../../models/Price";
import * as fs from "fs";
import {ChartJSNodeCanvas} from "chartjs-node-canvas";
import {freshRequire} from "chartjs-node-canvas/src/freshRequire";

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

        const image: Buffer = await createStockImage(ticker);
        const imageAttachment = new AttachmentBuilder(image, { name: 'candlestick.png' });
        const {embed, file} = generateStockEmbed(stock, yesterdayPrice);

        await interaction.reply({embeds: [embed], files: file ? [file, imageAttachment] : [imageAttachment]})
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
            .setImage("attachment://candlestick.png")
            .setTimestamp(new Date()),
        file
    }
};

async function createStockImage(ticker: string): Promise<Buffer> {
    const service = Service.getInstance();

    const d = new Date();
    d.setDate(d.getDate() - config.game.chartsDaysBack);
    const dateString = d.toLocaleString('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'numeric', day: 'numeric' });
    const [month, date, year] = dateString.split('/').map(x => parseInt(x));
    if (!year || !month || !date) throw new Error('Error parsing date components.');
    const priceHistory = (await service.stocks.getStockPriceHistoryAfterDay(ticker, year, month, date)).map(price => {
        return {
            x: new Date(price.year, price.month - 1, price.date).getTime(),
            o: dollarize(price.open_price),
            h: dollarize(price.high_price),
            l: dollarize(price.low_price),
            c: dollarize(price.close_price)
        }
    });

    const width = 800;
    const height = 400;
    const chartJSNodeCanvas = new ChartJSNodeCanvas({
        width, height, plugins: {
            modern: [ 'chartjs-chart-financial' ],
            globalVariableLegacy: [ 'chartjs-adapter-luxon' ]
        }
    });

    // Needs to run after the constructor but before any render function
    (global as any).window = (global as any).window || {};
    (global as any).window.luxon = freshRequire('luxon'); // Can just use normal require();

    const configuration: any = {
        type: 'candlestick',
        data:
            {
                datasets: [{
                    label: `${ticker} Price History`,
                    data: priceHistory,
                    borderWidth: 3,
                    color: {
                        up: config.colors.green,
                        down: config.colors.red,
                        unchanged: 'rgba(90, 90, 90, 1)'
                    },
                    borderColor: {
                        up: config.colors.green,
                        down: config.colors.red,
                        unchanged: 'rgba(90, 90, 90, 1)'
                    }

                }]
            },
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    }
                },
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    };

    return await chartJSNodeCanvas.renderToBuffer(configuration);
}

module.exports = command;