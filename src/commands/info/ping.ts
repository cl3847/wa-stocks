import {CacheType, CommandInteraction, SlashCommandBuilder} from "discord.js";
import CommandType from "../../models/CommandType";

const command: CommandType = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    async execute(interaction: CommandInteraction<CacheType>) {
        await interaction.reply('Pong!');
    },
};

module.exports = command;