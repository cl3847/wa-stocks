import {AutocompleteInteraction, CacheType, CommandInteraction, SharedSlashCommand} from "discord.js";

export type CommandType = {
    data: SharedSlashCommand;
    execute(interaction: CommandInteraction<CacheType>): Promise<void>;
    autocomplete?(interaction: AutocompleteInteraction): Promise<void>;
};

export default CommandType;