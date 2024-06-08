import CommandType from "../../models/CommandType";
import {
    ActionRowBuilder, ButtonBuilder,
    CacheType,
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    ButtonStyle, AttachmentBuilder, EmbedBuilder
} from "discord.js";
import Service from "../../services/Service";
import InsufficientBalanceError from "../../models/error/InsufficientBalanceError";
import log from "../../utils/logger";
import StockNotFoundError from "../../models/error/StockNotFoundError";
import Stock from "../../models/stock/Stock";
import fs from "fs";
import config from "../../../config";
import {dollarize, diffBlock} from "../../utils/helpers";
import Price from "../../models/Price";
import UserPortfolio from "../../models/user/UserPortfolio";
import InsufficientStockQuantityError from "../../models/error/InsufficientStockQuantityError";

const command: CommandType = {
    data: new SlashCommandBuilder()
        .setName('market')
        .setDescription('Buy and sell stocks.')
        .addStringOption(option =>
            option
                .setName("type")
                .setDescription('Choose to buy or sell stocks')
                .setRequired(true)
                .addChoices(
                    { name: 'Buy', value: 'buy' },
                    { name: 'Sell', value: 'sell' },
                ))
        .addStringOption(option =>
            option
                .setName('ticker')
                .setDescription('The ticker of the stock you want to buy or sell')
                .setRequired(true)
                .addChoices(Service.stockTickerList.map(ticker => ({ name: ticker, value: ticker }))))
        .addIntegerOption(option =>
            option
                    .setName('quantity')
                .setDescription('The quantity of the stock you want to buy or sell')),
    async execute(interaction: ChatInputCommandInteraction<CacheType>) {
        if (!interaction.isCommand()) return;
        const transactionType = interaction.options.getString('type', true);
        const ticker = interaction.options.getString('ticker', true);
        const quantity = interaction.options.getInteger('quantity') || 1;

        const service = Service.getInstance();
        const stock = await service.stocks.getStock(ticker);
        const user = await service.users.getUserPortfolio(interaction.user.id);
        const yesterdayPrice = await service.stocks.getYesterdayPrice(ticker);
        if (!stock) throw new StockNotFoundError(ticker);
        if (!user) {
            await interaction.reply('You do not have a profile yet.');
            return;
        }
        if (transactionType === 'buy') {
            if (user.balance < stock.price * quantity) {
                await interaction.reply('You do not have enough balance to buy this stock.');
                return;
            }

            const row = confirmComponent("Confirm Purchase", ButtonStyle.Success);
            const { embed, file } = confirmTransactionEmbed({ type: 'buy', quantity, stock, user, yesterdayPrice });
            const response = await interaction.reply({
                embeds: [embed],
                components: [row],
                files: file ? [file] : []
            });
            try {
                const confirmation = await response.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, time: 60_000 });
                if (confirmation.customId === 'confirm') {
                    try {
                        const transactionRecord = await service.transactions.buyStock(interaction.user.id, ticker, quantity);
                        await confirmation.update({ embeds: [embed,
                                confirmedEmbed(diffBlock(`+ PURCHASE SUCCESSFUL +\nOrder for ${quantity} share(s) of ${ticker} filled at $${dollarize(transactionRecord.price)} per share.`), config.colors.blue)
                            ], components: [] });
                    } catch(err) {
                        if (err instanceof InsufficientBalanceError) {
                            await confirmation.update({ embeds: [embed,
                                    confirmedEmbed(diffBlock(`- PURCHASE FAILED -\nOrder could not be filled due to insufficient balance (price may have changed).`), config.colors.blue)
                                ]});
                        } else {
                            log.error(err.stack);
                            await confirmation.update({ embeds: [embed,
                                    confirmedEmbed(diffBlock(`- PURCHASE FAILED -\nAn error occurred while filling your order.`), config.colors.blue)
                                ]});
                        }
                    }
                } else if (confirmation.customId === 'cancel') {
                    await confirmation.update({ embeds: [embed,
                            confirmedEmbed(diffBlock(`- PURCHASE CANCELLED -\nOrder for ${quantity} share(s) of ${ticker} cancelled.`), config.colors.blue)
                        ], components: [] });
                }
            } catch (e) {
                await response.edit({ embeds: [embed,
                        confirmedEmbed(diffBlock(`- PURCHASE CANCELLED -\nNo trade confirmation received.`), config.colors.blue)
                    ], components: [] });
            }
        } else if (transactionType === 'sell') {
            if ((user.portfolio.find(hs => hs.ticker === ticker)?.quantity || 0) < quantity) {
                await interaction.reply('You do not have enough shares to sell this quantity of stock.');
                return;
            }

            const row = confirmComponent("Confirm Sale", ButtonStyle.Danger);
            const { embed, file } = confirmTransactionEmbed({ type: 'sell', quantity, stock, user, yesterdayPrice });
            const response = await interaction.reply({
                embeds: [embed],
                components: [row],
                files: file ? [file] : []
            });
            try {
                const confirmation = await response.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, time: 60_000 });
                if (confirmation.customId === 'confirm') {
                    try {
                        const transactionRecord = await service.transactions.sellStock(interaction.user.id, ticker, quantity);
                        await confirmation.update({ embeds: [embed,
                                confirmedEmbed(diffBlock(`+ SALE SUCCESSFUL +\nOrder to sell ${quantity} share(s) of ${ticker} filled at $${dollarize(transactionRecord.price)} per share.`), config.colors.blue)
                            ], components: [] });
                    } catch(err) {
                        if (err instanceof InsufficientStockQuantityError) {
                            await confirmation.update({ embeds: [embed,
                                    confirmedEmbed(diffBlock(`- SALE FAILED -\nOrder could not be filled due to insufficient stock quantity.`), config.colors.blue)
                                ]});
                        } else {
                            log.error(err.stack);
                            await confirmation.update({ embeds: [embed,
                                    confirmedEmbed(diffBlock(`- SALE FAILED -\nAn error occurred while filling your order.`), config.colors.blue)
                                ]});
                        }
                    }
                } else if (confirmation.customId === 'cancel') {
                    await confirmation.update({ embeds: [embed,
                            confirmedEmbed(diffBlock(`- SALE CANCELLED -\nOrder to sell ${quantity} share(s) of ${ticker} cancelled.`), config.colors.blue)
                        ], components: [] });
                }
            } catch (e) {
                await response.edit({ embeds: [embed,
                        confirmedEmbed(diffBlock(`- SALE CANCELLED -\nNo trade confirmation received.`), config.colors.blue)
                    ], components: [] });
            }
        }
    },
};

function confirmTransactionEmbed(options: {
    type: 'buy' | 'sell',
    quantity: number,
    stock: Stock,
    user: UserPortfolio,
    yesterdayPrice: Price | null,
}) {
    const { type, quantity, stock, user, yesterdayPrice } = options;

    let thumbnail = 'https://i.imgur.com/AfFp7pu.png';
    let file;
    if (fs.existsSync('assets/stocks/' + stock.ticker + '.png')) {
        file = new AttachmentBuilder(`./assets/stocks/${stock.ticker}.png`, { name: `${stock.ticker}.png` });
        thumbnail = `attachment://${stock.ticker}.png`;
    }

    const priceDiff = stock.price - (yesterdayPrice ? yesterdayPrice.close_price : 0);
    const priceDiffPercent = priceDiff / (yesterdayPrice ? yesterdayPrice.close_price : 1);

    const titleString = type === 'buy' ? `Confirm Purchase: ${quantity} share(s) of ${stock.ticker}` : `Confirm Sale: ${quantity} share(s) of ${stock.ticker}`;
    const priceDiffString = `${priceDiff >= 0 ? '+' : '-'}$${dollarize(Math.abs(priceDiff))} (${(priceDiffPercent * 100).toFixed(2)}%) today`;
    const finalBalance = type === 'buy' ? user.balance - quantity * stock.price : user.balance + quantity * stock.price;
    const currentQuantity = user.portfolio.find(hs => hs.ticker === stock.ticker)?.quantity || 0;

    return {
        embed: new EmbedBuilder()
            .setTitle(titleString)
            .setDescription(diffBlock(`${stock.name}\n${stock.ticker} - $${dollarize(stock.price)} per share\n${priceDiffString}`) + diffBlock(`You currently own ${currentQuantity} share(s).`))
            .setColor(type == 'buy' ? config.colors.green : config.colors.red)
            .setThumbnail(thumbnail)
            .setTimestamp(new Date())
            .addFields(
                {name: 'Current Balance', value: diffBlock(`$${dollarize(user.balance)}`), inline: true},
                {name: 'Total Price', value: diffBlock(`${type == 'buy' ? '-' : '+'}$${dollarize(quantity * stock.price)}`), inline: true},
                {name: 'Final Balance', value: diffBlock(`= $${dollarize(finalBalance)}`), inline: true},
            ),
        file
    }
}

function confirmComponent(text: string, style: ButtonStyle): ActionRowBuilder<ButtonBuilder> {
    const confirm = new ButtonBuilder()
        .setCustomId('confirm')
        .setLabel(text)
        .setStyle(style);
    const cancel = new ButtonBuilder()
        .setCustomId('cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary);
    return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(confirm, cancel);
}

function confirmedEmbed(text: string, color: `#${string}`) {
    return new EmbedBuilder()
        .setDescription(text)
        .setColor(color)
        .setTimestamp(new Date());
}

module.exports = command;