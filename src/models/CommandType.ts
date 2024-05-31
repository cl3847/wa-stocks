import {CacheType, CommandInteraction,  SlashCommandOptionsOnlyBuilder} from "discord.js";

export type CommandType = {
    data: SlashCommandOptionsOnlyBuilder;
    execute(interaction: CommandInteraction<CacheType>): Promise<void>;
};

export default CommandType;