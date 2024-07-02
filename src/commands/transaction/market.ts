import CommandType from "../../types/CommandType";
import {
    AttachmentBuilder,
    ButtonStyle,
    CacheType,
    ChatInputCommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder
} from "discord.js";
import Service from "../../services/Service";
import InsufficientBalanceError from "../../models/error/InsufficientBalanceError";
import log from "../../utils/logger";
import Stock from "../../models/stock/Stock";
import config from "../../../config";
import {
    confirmComponent,
    confirmedEmbed,
    diffBlock,
    dollarize,
    getStockLogo,
    logToChannel,
    SHORT_PADDING
} from "../../utils/helpers";
import Price from "../../models/Price";
import UserPortfolio from "../../models/user/UserPortfolio";
import InsufficientStockQuantityError from "../../models/error/InsufficientStockQuantityError";

const command: CommandType = {
    data: new SlashCommandBuilder()
        .setName('market')
        .setDescription('Buy and sell stocks.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('sell')
                .setDescription('Sell shares of a stock')
                .addStringOption(option =>
                        option
                            .setName('ticker')
                            .setDescription('The ticker of the stock you want to sell')
                            .setRequired(true),
                    //.addChoices(Service.stockTickerList.map(ticker => ({ name: ticker, value: ticker })))
                )
                .addIntegerOption(option =>
                    option
                        .setName('quantity')
                        .setDescription('The quantity of the stock you want to sell')),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('buy')
                .setDescription('Buy shares of a stock')
                .addStringOption(option =>
                        option
                            .setName('ticker')
                            .setDescription('The ticker of the stock you want to buy')
                            .setRequired(true),
                    //.addChoices(Service.stockTickerList.map(ticker => ({ name: ticker, value: ticker })))
                )
                .addIntegerOption(option =>
                    option
                        .setName('quantity')
                        .setDescription('The quantity of the stock you want to buy')),
        ),
    async execute(interaction: ChatInputCommandInteraction<CacheType>) {
        if (!interaction.isCommand()) return;
        const transactionType = interaction.options.getSubcommand() as "buy" | "sell";
        const ticker = interaction.options.getString('ticker', true).toUpperCase();
        const quantity = interaction.options.getInteger('quantity') || 1;

        const service = Service.getInstance();
        const gameState = await service.game.getGameState();

        if (!gameState.isMarketOpen) {
            await interaction.reply({embeds: [confirmedEmbed(diffBlock(`- TRANSACTION FAILED -\nThe market is currently closed.`), config.colors.blue)], ephemeral: true});
            return;
        }

        const stock = await service.stocks.getStock(ticker);
        const user = await service.users.getUserPortfolio(interaction.user.id);
        const yesterdayPrice = await service.stocks.getYesterdayPrice(ticker);
        if (!stock) {
            await interaction.reply({embeds: [confirmedEmbed(diffBlock(`- LOOKUP FAILED -\nStock ${ticker} does not exist.`), config.colors.blue)], ephemeral: true});
            return;
        }
        if (!user) {
            await interaction.reply('You do not have a profile yet.');
            return;
        }
        if (transactionType === 'buy') {
            let useCreditAmount = 0;
            if (user.balance < stock.price * quantity) {
                // now we check if the user has enough available credit...
                const userAvailableCredit = Math.max(user.credit_limit - user.loan_balance, 0);
                if (user.balance + userAvailableCredit > stock.price * quantity) {
                    // user has enough credit...
                    useCreditAmount = stock.price * quantity - user.balance;
                } else {
                    await interaction.reply({embeds: [confirmedEmbed(diffBlock(`- PURCHASE FAILED -\nYou do not have enough balance to buy this amount of stock.`), config.colors.blue)], ephemeral: true});
                    return;
                }
            }

            const row = confirmComponent("Confirm Purchase", ButtonStyle.Success);
            const embeds: EmbedBuilder[] = [];
            const files: AttachmentBuilder[] = [];

            if (useCreditAmount > 0) {
                const creditEmbed = useCreditEmbed({
                    useCreditAmount,
                    quantity,
                    stock,
                    user
                });
                const stockLogo = getStockLogo(config.theme.financialCompanyLogo, 'creditlogo.png');
                if (stockLogo) {
                    files.push(stockLogo);
                    creditEmbed.setThumbnail(`attachment://creditlogo.png`);
                }
                embeds.push(creditEmbed)
            }

            const transactionEmbed = confirmTransactionEmbed({
                type: 'buy',
                quantity,
                stock,
                user,
                yesterdayPrice,
                useCreditAmount
            });
            const stockLogo = getStockLogo(ticker);
            if (stockLogo) {
                files.push(stockLogo);
                transactionEmbed.setThumbnail(`attachment://logo.png`);
            }
            embeds.push(transactionEmbed);

            const response = await interaction.reply({
                embeds,
                components: [row],
                files,
                ephemeral: config.bot.useEphemeralPurchase,
            });
            try {
                const confirmation = await response.awaitMessageComponent({
                    filter: i => i.user.id === interaction.user.id,
                    time: 60_000
                });
                if (confirmation.customId === 'confirm') {
                    try {
                        const transactionRecord = await service.transactions.buyStock(interaction.user.id, ticker, quantity, useCreditAmount > 0);
                        await confirmation.update({
                            embeds: [...embeds,
                                confirmedEmbed(diffBlock(`+ PURCHASE SUCCESSFUL +\nOrder for ${quantity} share(s) of ${ticker} filled at $${dollarize(transactionRecord.price)} per share.`), config.colors.blue)
                            ], components: [],
                        });
                        await logToChannel(interaction.client, (transactionRecord.credit_change !== 0 ? `💳 **${interaction.user.username}** used $${dollarize(transactionRecord.credit_change)} of ${config.theme.financialCompanyName} credit, increasing their debt to $${dollarize(user.loan_balance + transactionRecord.credit_change)}.\n` : "") +
                            `🟢 **${interaction.user.username}** purchased ${quantity} share(s) of ${ticker} at $${dollarize(transactionRecord.price)} per share!`)
                    } catch (err) {
                        if (err instanceof InsufficientBalanceError) {
                            await confirmation.update({
                                embeds: [...embeds,
                                    confirmedEmbed(diffBlock(`- PURCHASE FAILED -\nOrder could not be filled due to insufficient balance (price may have changed).`), config.colors.blue)
                                ], components: []
                            });
                        } else {
                            log.error(err.stack);
                            await confirmation.update({
                                embeds: [...embeds,
                                    confirmedEmbed(diffBlock(`- PURCHASE FAILED -\nAn error occurred while filling your order.`), config.colors.blue)
                                ], components: [],
                            });
                        }
                    }
                } else if (confirmation.customId === 'cancel') {
                    await confirmation.update({
                        embeds: [...embeds,
                            confirmedEmbed(diffBlock(`- PURCHASE CANCELLED -\nOrder for ${quantity} share(s) of ${ticker} cancelled.`), config.colors.blue)
                        ], components: []
                    });
                }
            } catch (e) {
                await response.edit({
                    embeds: [...embeds,
                        confirmedEmbed(diffBlock(`- PURCHASE CANCELLED -\nNo trade confirmation received.`), config.colors.blue)
                    ], components: []
                });
            }
        } else if (transactionType === 'sell') {
            if ((user.portfolio.find(hs => hs.ticker === ticker)?.quantity || 0) < quantity) {
                await interaction.reply({embeds: [confirmedEmbed(diffBlock(`- SALE FAILED -\nYou do not have enough shares to sell this quantity of stock.`), config.colors.blue)], ephemeral: true});
                return;
            }

            const row = confirmComponent("Confirm Sale", ButtonStyle.Danger);
            const files: AttachmentBuilder[] = [];
            const embed = confirmTransactionEmbed({
                type: 'sell',
                quantity,
                stock,
                user,
                yesterdayPrice,
                useCreditAmount: 0
            });
            const stockLogo = getStockLogo(ticker);
            if (stockLogo) {
                files.push(stockLogo);
                embed.setThumbnail(`attachment://logo.png`);
            }

            const response = await interaction.reply({
                embeds: [embed],
                components: [row],
                files,
                ephemeral: config.bot.useEphemeralPurchase,
            });
            try {
                const confirmation = await response.awaitMessageComponent({
                    filter: i => i.user.id === interaction.user.id,
                    time: 60_000
                });
                if (confirmation.customId === 'confirm') {
                    try {
                        const transactionRecord = await service.transactions.sellStock(interaction.user.id, ticker, quantity);
                        await confirmation.update({
                            embeds: [embed,
                                confirmedEmbed(diffBlock(`+ SALE SUCCESSFUL +\nOrder to sell ${quantity} share(s) of ${ticker} filled at $${dollarize(transactionRecord.price)} per share.`), config.colors.blue)
                            ], components: []
                        });
                        await logToChannel(interaction.client,
                            `🔴 **${interaction.user.username}** sold ${quantity} share(s) of ${ticker} at $${dollarize(transactionRecord.price)} per share!`)
                    } catch (err) {
                        if (err instanceof InsufficientStockQuantityError) {
                            await confirmation.update({
                                embeds: [embed,
                                    confirmedEmbed(diffBlock(`- SALE FAILED -\nOrder could not be filled due to insufficient stock quantity.`), config.colors.blue)
                                ], components: []
                            });
                        } else {
                            log.error(err.stack);
                            await confirmation.update({
                                embeds: [embed,
                                    confirmedEmbed(diffBlock(`- SALE FAILED -\nAn error occurred while filling your order.`), config.colors.blue)
                                ], components: []
                            });
                        }
                    }
                } else if (confirmation.customId === 'cancel') {
                    await confirmation.update({
                        embeds: [embed,
                            confirmedEmbed(diffBlock(`- SALE CANCELLED -\nOrder to sell ${quantity} share(s) of ${ticker} cancelled.`), config.colors.blue)
                        ], components: []
                    });
                }
            } catch (e) {
                await response.edit({
                    embeds: [embed,
                        confirmedEmbed(diffBlock(`- SALE CANCELLED -\nNo trade confirmation received.`), config.colors.blue)
                    ], components: []
                });
            }
        }
    },
};

function confirmTransactionEmbed(options: {
    type: 'buy' | 'sell',
    quantity: number,
    stock: Stock,
    user: UserPortfolio,
    useCreditAmount: number,
    yesterdayPrice: Price | null,
}) {
    const {type, quantity, stock, user, yesterdayPrice} = options;

    const priceDiff = stock.price - (yesterdayPrice ? yesterdayPrice.close_price : 0);
    const priceDiffPercent = priceDiff / (yesterdayPrice ? yesterdayPrice.close_price : 1);
    const percentDisplay = yesterdayPrice !== null ? (priceDiffPercent * 100).toFixed(2) : "N/A";

    const titleString = type === 'buy' ? `Confirm Purchase: ${quantity} share(s) of ${stock.ticker}` : `Confirm Sale: ${quantity} share(s) of ${stock.ticker}`;
    const priceDiffString = `${priceDiff >= 0 ? '+' : '-'}$${dollarize(Math.abs(priceDiff))} (${percentDisplay}%) today`;
    const finalBalance = type === 'buy' ? user.balance + options.useCreditAmount - quantity * stock.price : user.balance + quantity * stock.price;
    const currentQuantity = user.portfolio.find(hs => hs.ticker === stock.ticker)?.quantity || 0;

    return new EmbedBuilder()
        .setTitle(titleString)
        .setDescription(diffBlock(`${stock.name}\n${stock.ticker} - $${dollarize(stock.price)} per share\n${priceDiffString}`) + diffBlock(`You currently own ${currentQuantity} share(s).`) + SHORT_PADDING +
            diffBlock(
                `  $${dollarize(options.user.balance)} current balance\n` +
                (options.useCreditAmount ? `+ $${dollarize(options.useCreditAmount)} credit from ${config.theme.financialCompanyName}\n` : "") +
                `${type == 'buy' ? '-' : '+'} $${dollarize(quantity * stock.price)} total price\n` +
                `= $${dollarize(finalBalance)} final balance\n`
            )
        )
        .setColor(type == 'buy' ? config.colors.green : config.colors.red)
        .setTimestamp(new Date())
}

function useCreditEmbed(options: {
    useCreditAmount: number;
    quantity: number,
    stock: Stock,
    user: UserPortfolio,
}): EmbedBuilder {
    const desc = `${diffBlock(`Your balance of $${dollarize(options.user.balance)} is insufficient for this purchase costing $${dollarize(options.stock.price * options.quantity)}, but you can use available credit from ${config.theme.financialCompanyName} to cover the difference!`)}${diffBlock(
        `Credit Limit: $${dollarize(options.user.credit_limit)}\n` +
        `Available Credit: $${dollarize(Math.max(0, options.user.credit_limit - options.user.loan_balance))}\n` +
        `Current Debt: $${dollarize(options.user.loan_balance)}\n\n` +
        `- INTEREST RATE: ${config.game.creditDailyInterestPercent}% per day`
    )}`;
    return new EmbedBuilder()
        .setTitle(`Use ${config.theme.financialCompanyName} credit for this transaction!`)
        .setDescription(desc)
        .setColor(config.theme.financialCompanyColor)
}

module.exports = command;