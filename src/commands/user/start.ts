import CommandType from "../../models/CommandType";
import {CacheType, CommandInteraction, SlashCommandBuilder} from "discord.js";
import Service from "../../services/Service";

const command: CommandType = {
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription('Creates a profile for you and/or starts a tutorial.'),
    async execute(interaction: CommandInteraction<CacheType>) {
        const service = Service.getInstance();
        const user = await service.users.getUser(interaction.user.id);
        if (!user) {
            // TODO create user
        }
        // TODO start tutorial
    },
};

module.exports = command;