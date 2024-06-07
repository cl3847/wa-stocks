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
                        await service.transactions.buyStock(interaction.user.id, ticker, quantity);
                    } catch(err) {
                        if (err instanceof InsufficientBalanceError) {
                            await interaction.reply('You do not have enough balance to buy this stock (Stock price may have updated).');
                        } else {
                            log.error(err.stack);
                            await interaction.reply('An error occurred while buying the stock.');
                        }
                    }
                    await confirmation.update({ content: `You bought ${quantity} ${ticker} stocks.`, components: [] }); // TODO make this look nice
                } else if (confirmation.customId === 'cancel') {
                    await confirmation.update({ content: 'Action cancelled', components: [] });
                }
            } catch (e) {
                await interaction.editReply({ content: 'Purchase confirmation not received, cancelling', components: [] });
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
                        await service.transactions.sellStock(interaction.user.id, ticker, quantity);
                    } catch(err) {
                        if (err instanceof InsufficientBalanceError) {
                            await interaction.reply('You do not have enough shares to sell this quantity of stock.');
                        } else {
                            log.error(err.stack);
                            await interaction.reply('An error occurred while buying the stock.');
                        }
                    }
                    await confirmation.update({ content: `You bought ${quantity} ${ticker} stocks.`, components: [] }); // TODO make this look nice
                } else if (confirmation.customId === 'cancel') {
                    await confirmation.update({ content: 'Action cancelled', components: [] });
                }
            } catch (e) {
                await interaction.editReply({ content: 'Sell confirmation not received, cancelling', components: [] });
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

    const titleString = type === 'buy' ? `Confirm Purchase: ${quantity} shares of ${stock.ticker}` : `Confirm Sell: ${quantity} shares of ${stock.ticker}`;
    const priceDiffString = `${priceDiff >= 0 ? '+' : '-'}$${dollarize(Math.abs(priceDiff))} (${(priceDiffPercent * 100).toFixed(2)}%)`;
    const finalBalance = type === 'buy' ? user.balance - quantity * stock.price : user.balance + quantity * stock.price;

    return {
        embed: new EmbedBuilder()
            .setTitle(titleString)
            .setDescription(diffBlock(`${stock.ticker} - ${stock.name} - $${dollarize(stock.price)}\n${priceDiffString}`))
            .setColor(config.colors.green)
            .setThumbnail(thumbnail)
            .setTimestamp(new Date())
            .addFields(
                { name: '\u200B', value: '\u200B' },
                {name: 'Current Balance', value: diffBlock(`$${dollarize(user.balance)}`), inline: true},
                {name: 'Total Price', value: diffBlock(`${type == 'buy' ? '-' : '+'}$${dollarize(quantity * stock.price)}`), inline: true},
                {name: 'Final Balance', value: diffBlock(`$${dollarize(finalBalance)}`), inline: true},
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

module.exports = command;