import {CacheType, CommandInteraction, SlashCommandBuilder} from "discord.js";
import Service from "../../services/Service";
import CommandType from "../../models/CommandType";

/**
 * TODO Stylize these responses with embeds.
 * I'm thinking a multiple pages approach, first page is your balance, net worth, and top 3 stocks,
 * The next pages are just lists of your stock holdings with quantity and value.
  */


const command: CommandType = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Displays your profile and portfolio information.'),
    async execute(interaction: CommandInteraction<CacheType>) {
        const service = Service.getInstance();
        const userPortfolio = await service.users.getUserPortfolio(interaction.user.id);
        if (!userPortfolio) {
            await interaction.reply('You do not have a profile yet.');
            return;
        }

        await interaction.reply(`**${interaction.user.username}**'s profile:\n` +
            `Balance: $${userPortfolio.balance.toFixed(2)}\n` +
            `Portfolio: ${userPortfolio.portfolio.map(hs => `${hs.ticker}: ${hs.quantity}`).join(', ')}`)
    },
};

module.exports = command;