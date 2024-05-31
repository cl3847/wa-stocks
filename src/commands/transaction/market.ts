import CommandType from "../../models/CommandType";
import {CacheType, CommandInteraction, SlashCommandBuilder} from "discord.js";

const command: CommandType = {
    data: new SlashCommandBuilder()
        .setName('market')
        .setDescription('Buy and sell stocks.'),
    async execute(interaction: CommandInteraction<CacheType>) {

        await interaction.reply('test');
        // TODO start tutorial
    },
};

module.exports = command;