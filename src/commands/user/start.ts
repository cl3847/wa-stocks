import CommandType from "../../types/CommandType";
import {AttachmentBuilder, CacheType, CommandInteraction, EmbedBuilder, SlashCommandBuilder} from "discord.js";
import Service from "../../services/Service";
import config from "../../../config";
import {confirmedEmbed, diffBlock, dollarize, handleEmbedNavigator} from "../../utils/helpers";

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
            } catch (err) {
                await interaction.reply({embeds: [confirmedEmbed(diffBlock(`- SETUP FAILED -\nYour profile could not be set up.`), config.colors.blue)]});
                return;
            }
        }
        await handleEmbedNavigator(interaction, tutorialEmbeds, new Map<number, AttachmentBuilder[]>(), 300_000);
    },
};

const tutorialEmbeds = [
    new EmbedBuilder() // page 1
        .setTitle('Tutorial: Profile and Portfolio')
        .setColor(config.colors.blue)
        .setDescription(`Welcome to The Wolf of Ayup! If this is the first time you've used \`/stock\`, $${dollarize(config.game.startingBalance)} will have been deposited into your account. You can use this money to buy stocks, send money to other users, and more!\n\n` +
            `\`/profile <user?>\`: displays you or another user's balance, as well as other information about your account and inventory.`)
        .setImage(`https://i.imgur.com/YE7TRfD.png`)
        .setFooter({text: 'Page 1/5'}),
    new EmbedBuilder()
        .setTitle('Tutorial: Buying & Selling Shares')
        .setColor(config.colors.blue)
        .setDescription(`The aim of the game is to grow your net worth. This requires investing in companies. Each company has a unique ticker (a 3-5 letter code) used to identify it, which you can find in <#${config.bot.channels.info}>.\n\n` +
            `Shares can be purchased for a given price, which fluctuates over the course of the day whenever the market is open (according to <#${config.bot.channels.info}>). Buy shares, and try to sell them for higher than you paid to make a profit!\n\n` +
            `\`/stock <ticker>\`: shows information about a particular company.\n` +
            `\`/market buy <ticker> <quantity?>\`: buy shares of a particular company.\n` +
            `\`/market sell <ticker> <quantity?>\`: buy shares of a particular company.\n\n` +
            `After buying a share, it's added to your portfolio, or your collection of shares. You can view your portfolio with \`/profile\`.`)
        .setImage(`https://i.imgur.com/q9dWSyR.png`)
        .setFooter({text: 'Page 2/5'}),
]

module.exports = command;