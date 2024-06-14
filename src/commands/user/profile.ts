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
import {dollarize, diffBlock} from "../../utils/helpers";
import Price from "../../models/Price";

//const PADDING = "————————————————————————————————————————————\n";

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
    let totalPriceDiff = 0;
    let totalYesterdayPrice = 0;
    let displayPortfolio = userPortfolio.portfolio.map(hs => {
        const yesterdayPrice = yesterdayPrices.find(p => p.ticker === hs.ticker);
        const priceDiff = (hs.price * hs.quantity - (yesterdayPrice ? yesterdayPrice.close_price * hs.quantity : 0));
        const priceDiffPercent = priceDiff / (yesterdayPrice ? yesterdayPrice.close_price * hs.quantity : 1);

        totalPriceDiff += priceDiff;
        totalYesterdayPrice += (yesterdayPrice ? yesterdayPrice.close_price * hs.quantity : 0);

        return `${hs.ticker} - ${hs.quantity} share(s) - $${dollarize(hs.price * hs.quantity)}\n${priceDiff > 0 ? '+' : '-'}$${dollarize(Math.abs(priceDiff))} (${(priceDiffPercent * 100).toFixed(2)}%)`;
    }).join('\n') || 'No stocks owned.';

    const {diff: valueDiff, percent: valueDiffPercent} = await userPortfolio.getDayPortfolioChange();
    const displayBalance = `$${dollarize(userPortfolio.balance)}`;
    const percentDisplay = valueDiffPercent ? (valueDiffPercent * 100).toFixed(2) : "N/A";

    return new EmbedBuilder()
        .setColor(config.colors.green)
        .setAuthor({name: `${user.displayName}'s Profile`, iconURL: user.avatarURL() || undefined})
        .setImage("https://images-ext-1.discordapp.net/external/WZApakQTOFUPSVHnGC_2jHRyV54XSvIW3kAMSThiIHM/https/t4.ftcdn.net/jpg/06/46/48/39/360_F_646483996_FU8STGnemtNlh7eprlfh1fZtBmAW8lV2.jpg")
        //.setDescription(PADDING)
        .addFields(
            {name: 'Balance', value: diffBlock(displayBalance), inline: true},
            {name: 'Net Worth', value: diffBlock(`$${dollarize(userPortfolio.netWorth())}`), inline: true},
            {name: '\t', value: '\t'},
            {name: 'Total Portfolio Value', value: diffBlock(`$${dollarize(totalYesterdayPrice)}`), inline: true},
            {name: 'Portfolio Change Today', value: diffBlock(`${valueDiff > 0 ? '+' : '-'}$${dollarize(Math.abs(valueDiff))} (${percentDisplay}%)`), inline: true},
            {name: 'Portfolio', value: diffBlock(displayPortfolio)},
        );
};

module.exports = command;