import ItemAction from "../../models/item/ItemAction";
import {confirmedEmbed, diffBlock, dollarize, logToChannel} from "../../utils/helpers";
import Service from "../../services/Service";
import config from "../../../config";
import ItemNotFoundError from "../../models/error/ItemNotFoundError";
import InsufficientItemQuantityError from "../../models/error/InsufficientItemQuantityError";

const valueConfig = [
    {item: '911', value: 100000000},
    {item: '912', value: 10000000},
    {item: '913', value: 1000000},
    {item: '914', value: 100000},
    {item: '915', value: 10000},
    {item: '916', value: 1000},
    {item: '917', value: 100},
    {item: '918', value: 10},
    {item: '919', value: 1}
];

const pullPair: {itemIds: string[], action: ItemAction} = {
    itemIds: ["911", "912", "913", "914", "915", "916", "917", "918", "919"],
    action: {
        name: "Cash Check",
        order: 1,
        execute: async (confirmation, thisItem, user) => {
            const service = Service.getInstance();
            try {
                const itemValue = valueConfig.find(x => x.item === thisItem.item_id)!.value; // error thrown if it doesn't exist
                await service.transactions.cashItem(user.uid, thisItem.item_id, itemValue);
                await logToChannel(confirmation.client, `🪙 **${(await confirmation.client.users.fetch(user.uid)).username}** just cashed a *${thisItem.name}*, gaining $${dollarize(itemValue)}!`);
                return;
            } catch (error) {
                if (error instanceof ItemNotFoundError) {
                    await confirmation.update({
                        embeds: [...confirmation.message.embeds,
                            confirmedEmbed(diffBlock(`- OPERATION FAILED-\nAn error occurred: item not found.`), config.colors.blue)
                        ], components: []
                    });
                } else if (error instanceof InsufficientItemQuantityError) {
                    await confirmation.update({
                        embeds: [...confirmation.message.embeds,
                            confirmedEmbed(diffBlock(`- OPERATION FAILED-\nAn error occurred: insufficient item quantity.`), config.colors.blue)
                        ], components: []
                    });
                } else {
                    await confirmation.update({
                        embeds: [...confirmation.message.embeds,
                            confirmedEmbed(diffBlock(`- OPERATION FAILED-\nAn error occurred while using this item.`), config.colors.blue)
                        ], components: []
                    });
                }
            }
        },
        identifier: "cash-check"
    }
};

module.exports = pullPair;