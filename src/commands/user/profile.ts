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
import {dollarize, diffBlock, getETCComponentsPreviousDay} from "../../utils/helpers";
import Price from "../../models/Price";

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
        const yesterdayPrices = await service.stocks.getAllYesterdayPrice();
        await interaction.reply({embeds: [await generateProfileEmbed(userPortfolio, yesterdayPrices, user)]});
    },
};

const generateProfileEmbed = async (userPortfolio: UserPortfolio, yesterdayPrices: Price[], user: User) => {
    const yesterdayPortfolio = await Service.getInstance().users.getUserPortfolioTimestamp(user.id, new Date().setUTCHours(config.game.etcOffset, 0, 0, 0));

    const {year, month, date} = getETCComponentsPreviousDay();
    const portfolioValue = await userPortfolio.portfolioValue();
    const yesterdayPortfolioValue = await yesterdayPortfolio?.portfolioValueOn(year, month, date);

    let totalPriceDiff = 0;
    let totalYesterdayPrice = 0;
    const displayPortfolio = userPortfolio.portfolio.map(hs => {
        const yesterdayPrice = yesterdayPrices.find(p => p.ticker === hs.ticker);
        const priceDiff = (hs.price * hs.quantity - (yesterdayPrice ? yesterdayPrice.close_price * hs.quantity : 0));
        const priceDiffPercent = priceDiff / (yesterdayPrice ? yesterdayPrice.close_price * hs.quantity : 1);

        totalPriceDiff += priceDiff;
        totalYesterdayPrice += (yesterdayPrice ? yesterdayPrice.close_price * hs.quantity : 0);

        return `${hs.ticker} - ${hs.quantity} share(s) - $${dollarize(hs.price * hs.quantity)}\n${priceDiff > 0 ? '+' : '-'}$${dollarize(Math.abs(priceDiff))} (${(priceDiffPercent * 100).toFixed(2)}%)`;
    }).join('\n') || 'No stocks owned.';
    const valueDiff = portfolioValue - (yesterdayPortfolioValue ? yesterdayPortfolioValue : 0);
    const valueDiffPercent = valueDiff / (yesterdayPortfolioValue || 1);

    const displayBalance = `$${dollarize(userPortfolio.balance)}`;
    return new EmbedBuilder()
        .setColor(config.colors.green)
        .setAuthor({name: `${user.displayName}'s Profile`, iconURL: user.avatarURL() || undefined})
        .addFields(
            {name: 'Balance', value: diffBlock(displayBalance), inline: true},
            {name: 'Net Worth', value: diffBlock(`$${dollarize(userPortfolio.netWorth())}`), inline: true},
            {name: 'Today\'s Portfolio Change', value: diffBlock(`${valueDiff > 0 ? '+' : '-'}$${dollarize(Math.abs(valueDiff))} (${(valueDiffPercent * 100).toFixed(2)}%)`), inline: true},
            {name: 'Portfolio', value: diffBlock(displayPortfolio)},
        );
};

module.exports = command;