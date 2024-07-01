import {CommandInteraction, User} from "discord.js";
import Item from "./Item";

interface ItemAction {
    name: string;
    order: number;
    execute: (interaction: CommandInteraction, item: Item, user: User) => Promise<void>;
}

export default ItemAction;