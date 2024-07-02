import ItemAction from "../../models/item/ItemAction";

const ratesConfig = {
    "101": 32,
    "102": 32,
    "103": 15,
    "104": 15,
    "105": 3,
    "106": 3,
};

const pullPair: {itemIds: string[], action: ItemAction} = {
    itemIds: ["100"],
    action: {
        name: "Open Booster Pack",
        order: 1,
        execute: async (confirmation, item, user) => {
            confirmation.update("test")
        },
        identifier: "open-booster-pack"
    }
};

module.exports = pullPair;