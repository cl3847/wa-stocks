import {MessageComponentInteraction} from "discord.js";
import Item from "./Item";
import User from "../user/User";

interface ItemAction {
    name: string;
    identifier: string;
    order: number;
    execute: (confirmation: MessageComponentInteraction, item: Item, user: User) => Promise<void>;
}

export default ItemAction;