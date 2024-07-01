import ItemAction from "../../models/item/ItemAction";

const ratesConfig = {
    "101": 32,
    "102": 32,
    "103": 15,
    "104": 15,
    "105": 3,
    "106": 3,
}

const pullPair: {itemIds: string[], action: ItemAction} = {
    itemIds: ["100"],
    action: {
        name: "Pull Trading Card",
        order: 1,
        execute: async (interaction, item, user) => {
            interaction; item; user;
        }
    }
}

ratesConfig;

export default pullPair;