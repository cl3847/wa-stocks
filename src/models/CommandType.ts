import {CacheType, CommandInteraction , SlashCommandBuilder} from "discord.js";

export type CommandType = {
    data: SlashCommandBuilder;
    execute(interaction: CommandInteraction<CacheType>): Promise<void>;
};

export default CommandType;