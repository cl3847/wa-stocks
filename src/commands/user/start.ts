import CommandType from "../../types/CommandType";
import {AttachmentBuilder, CacheType, CommandInteraction, EmbedBuilder, SlashCommandBuilder} from "discord.js";
import Service from "../../services/Service";
import config from "../../../config";
import {confirmedEmbed, diffBlock, dollarize, handleEmbedNavigator, logToChannel} from "../../utils/helpers";

const command: CommandType = {
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription('Creates a profile for you and/or starts a tutorial.'),
    async execute(interaction: CommandInteraction<CacheType>) {
        const service = Service.getInstance();
        const user = await service.users.getUser(interaction.user.id);
        if (!user) {
            try {
                await service.users.initUser(interaction.user.id);
                await logToChannel(interaction.client, `🎉 **${interaction.user.username}** registered an account with ${config.theme.financialCompanyName}!`);
            } catch (err) {
                await interaction.reply({embeds: [confirmedEmbed(diffBlock(`- SETUP FAILED -\nYour profile could not be set up.`), config.colors.blue)]});
                return;
            }
        }
        await handleEmbedNavigator(interaction, tutorialEmbeds, new Map<number, AttachmentBuilder[]>(), 300_000, true);
    },
};

const tutorialEmbeds = [
    new EmbedBuilder() // page 1
        .setTitle('Tutorial: Profile and Portfolio')
        .setColor(config.colors.blue)
        .setDescription(`Welcome to The Wolf of Ayup! If this is the first time you've used \`/start\`, $${dollarize(config.game.startingBalance)} will have been deposited into your account. You can use this money to buy stocks, send money to other users, and more!\n\n` +
            `\`/profile <user?>\`: displays you or another user's balance, as well as other information about your account and inventory.`)
        .setImage(`https://i.imgur.com/YE7TRfD.png`)
        .setFooter({text: 'Page 1/5'}),
    new EmbedBuilder()
        .setTitle('Tutorial: Buying & Selling Shares')
        .setColor(config.colors.blue)
        .setDescription(`The aim of the game is to grow your net worth. This requires investing in companies. Each company has a unique ticker (a 3-5 letter code) used to identify it, which you can find in <#${config.bot.channels.info}>.\n\n` +
            `Shares can be purchased for a given price, which fluctuates over the course of the day **whenever the market is open** (according to <#${config.bot.channels.info}>). Buy shares, and try to sell them for higher than you paid to make a profit!\n\n` +
            `\`/stock <ticker>\`: shows information about a particular company.\n` +
            `\`/market buy <ticker> <quantity?>\`: buy shares of a particular company.\n` +
            `\`/market sell <ticker> <quantity?>\`: sell shares of a particular company.\n\n` +
            `After buying a share, it's added to your portfolio, or your collection of shares. You can view your portfolio with \`/profile\`.`)
        .setImage(`https://i.imgur.com/q9dWSyR.png`)
        .setFooter({text: 'Page 2/5'}),
    new EmbedBuilder()
        .setTitle('Tutorial: Items and Trading Cards')
        .setColor(config.colors.blue)
        .setDescription(`You can find your inventory in the second page of \`/profile\`. Some items, like the \`Booster Pack (ID 900)\`, which you start off with, can be used for actions as well.\n\n` +
            `Try viewing your Booster Pack with the \`/item\` command, and open the pack for a Trading Card! Once you have more than one trading card, you can exchange them with other users for money or other cards.\n\n` +
            `\`/profile <user?>\`: Second page displays inventory contents.\n` +
            `\`/item <item_id>\`: Shows information & actions for one of your items.\n\n` +
            `__Be the first to collect every trading card to win!__ Additional booster packs are distributed by game moderators every Friday at market close to the individuals with the highest net worth.`)
        .setImage(`https://i.imgur.com/4bq2R23.png`)
        .setFooter({text: 'Page 3/5'}),
    new EmbedBuilder()
        .setTitle('Tutorial: Wire Transactions')
        .setColor(config.colors.blue)
        .setDescription(`Sending money to other users is easy with the \`/wire\` command! There are two variants, \`user\` and \`entity\`. Use the former for transferring money to other players, and the latter to transfer money to entities like your bank (more on that later).\n\n` +
            `\`/wire user <target> <balance>\`: Transfer money to a user.\n` +
            `\`/wire entity <target> <balance>\`: Transfer money to an entity.\n\n` +
            `**Wire transactions are non-refundable and permanant.**`)
        .setImage(`https://i.imgur.com/Gp8NSYy.png`)
        .setFooter({text: 'Page 4/5'}),
    new EmbedBuilder()
        .setTitle('Tutorial: Credit and Paying Debt')
        .setColor(config.colors.blue)
        .setDescription(`Trying to buy a stock but don't have enough money? ${config.theme.financialCompanyName} will automatically suggest taking out some debt to cover the difference, as long as you have enough unused credit remaining in your account.\n\n` +
            `You can check your current debt and credit limit using \`/profile\`. Debt increases at a constant interest rate per day, so be sure to pay it off when you can by wiring ${config.theme.financialCompanyName} money:\n\n` +
            `\`/wire entity ${config.theme.financialCompanyTicker} <balance>\`: Pay off your debt to the bank.\n\n` +
            `Taking out debt is optional, but it can greatly increase the speed at which you make profits!`)
        .setImage(`https://i.imgur.com/OLp1p3a.png`)
        .setFooter({text: 'Page 5/5'}),

]

module.exports = command;