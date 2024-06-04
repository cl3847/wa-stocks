import CommandType from "../../models/CommandType";
import {CacheType, ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";
import Service from "../../services/Service";
import InsufficientBalanceError from "../../models/error/InsufficientBalanceError";
import log from "../../utils/logger";
import UserNotFoundError from "../../models/error/UserNotFoundError";
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
        if (transactionType === 'buy') {
            try {
                await service.transactions.buyStock(interaction.user.id, ticker, quantity);
                await interaction.reply(`You bought ${quantity} ${ticker} stocks.`);
            } catch(err) {
                if (err instanceof InsufficientBalanceError) {
                    await interaction.reply('You do not have enough balance to buy this stock.');
                } else if (err instanceof UserNotFoundError) {
                    await interaction.reply('You do not have a profile yet.');
                } else {
                    log.error(err.stack);
                    await interaction.reply('An error occurred while buying the stock.');
                }
            }
        } else if (transactionType === 'sell') {
            try {
                await service.transactions.sellStock(interaction.user.id, ticker, quantity);
                await interaction.reply(`You sold ${quantity} ${ticker} stocks.`);
            } catch(err) {
                if (err instanceof InsufficientStockQuantityError) {
                    await interaction.reply('You do not have enough shares to sell this amount of stock.');
                } else if (err instanceof UserNotFoundError) {
                    await interaction.reply('You do not have a profile yet.');
                } else {
                    log.error(err.stack);
                    await interaction.reply('An error occurred while selling the stock.');
                }
            }
        }
    },
};

module.exports = command;