import {
    CacheType,
    ChatInputCommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder,
    User
} from "discord.js";
import Service from "../../services/Service";
import CommandType from "../../models/CommandType";
import UserPortfolio from "src/models/user/UserPortfolio";
import config from "../../../config";
import {centsToDollars, stringToDiffBlock} from "../../utils/helpers";
import Price from "../../models/Price";

/**
 * TODO Stylize these responses with embeds.
 * I'm thinking a multiple pages approach, first page is your balance, net worth, and top 3 stocks,
 * The next pages are just lists of your stock holdings with quantity and value.
 */

const command: CommandType = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Displays your profile and portfolio information.')
        .addUserOption(
            option =>
                option.setName('user')
                    .setDescription('The user to lookup')
                    .setRequired(false)
        ),
    async execute(interaction: ChatInputCommandInteraction<CacheType>) {
        const service = Service.getInstance();
        const user = interaction.options.getUser('user') || interaction.user;
        const userPortfolio = await service.users.getUserPortfolio(user.id);
        if (!userPortfolio) {
            await interaction.reply('You do not have a profile yet.');
            return;
        }
        const yesterdayPrices = await service.stocks.getYesterdayPrices();
        await interaction.reply({embeds: [generateProfileEmbed(userPortfolio, yesterdayPrices, user)]});
    },
};

const generateProfileEmbed = (userPortfolio: UserPortfolio, yesterdayPrices: Price[], user: User) => {
    const displayBalance = `$${centsToDollars(userPortfolio.balance)}`;
    let totalPriceDiff = 0;
    let totalYesterdayPrice = 0;
    const displayPortfolio = userPortfolio.portfolio.map(hs => {
        const yesterdayPrice = yesterdayPrices.find(p => p.ticker === hs.ticker);
        const priceDiff = (hs.price * hs.quantity - (yesterdayPrice ? yesterdayPrice.price * hs.quantity : 0));
        const priceDiffPercent = priceDiff / (yesterdayPrice ? yesterdayPrice.price * hs.quantity : 1);

        totalPriceDiff += priceDiff;
        totalYesterdayPrice += (yesterdayPrice ? yesterdayPrice.price * hs.quantity : 0);

        return `${hs.ticker} - ${hs.quantity} share(s) - $${centsToDollars(hs.price * hs.quantity)}\n${priceDiff > 0 ? '+' : '-'}$${centsToDollars(Math.abs(priceDiff))} (${(priceDiffPercent * 100).toFixed(2)}%)`;
    }).join('\n') || 'No stocks owned.';
    const totalPriceDiffPercent = totalPriceDiff / (totalYesterdayPrice || 1);

    return new EmbedBuilder()
        .setColor(config.colors.green)
        .setAuthor({name: `${user.displayName}'s Profile`, iconURL: user.avatarURL() || undefined})
        .addFields(
            {name: 'Balance', value: stringToDiffBlock(displayBalance), inline: true},
            {name: 'Net Worth', value: stringToDiffBlock(`$${centsToDollars(userPortfolio.netWorth())}`), inline: true},
            {name: 'Today\'s Portfolio Change', value: stringToDiffBlock(`${totalPriceDiff > 0 ? '+' : '-'}$${centsToDollars(Math.abs(totalPriceDiff))} (${(totalPriceDiffPercent * 100).toFixed(2)}%)`), inline: true},
            {name: 'Portfolio', value: stringToDiffBlock(displayPortfolio)},
        );
};

module.exports = command;