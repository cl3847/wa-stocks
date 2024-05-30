import {CacheType, CommandInteraction, SlashCommandBuilder} from "discord.js";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    async execute(interaction: CommandInteraction<CacheType>) {
        await interaction.reply('Pong!');
    },
};