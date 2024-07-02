import ItemAction from "../../models/item/ItemAction";
import {confirmedEmbed, diffBlock, getItemImage, weightedRandom} from "../../utils/helpers";
import Service from "../../services/Service";
import config from "../../../config";
import {AttachmentBuilder, EmbedBuilder} from "discord.js";
import ItemNotFoundError from "../../models/error/ItemNotFoundError";
import InsufficientItemQuantityError from "../../models/error/InsufficientItemQuantityError";

const ratesConfig = [
    {item: '400', rate: 35},
    {item: '401', rate: 35},
    {item: '300', rate: 15},
    {item: '200', rate: 9},
    {item: '100', rate: 3},
    {item: '101', rate: 3},
]

const pullPair: {itemIds: string[], action: ItemAction} = {
    itemIds: ["900"],
    action: {
        name: "Open Booster Pack",
        order: 1,
        execute: async (confirmation, thisItem, user) => {
            const service = Service.getInstance();
            const rollResult = weightedRandom<string>(ratesConfig.map(x => x.item), ratesConfig.map(x => x.rate));
            try {
                await service.transactions.replaceItemWithNew(user.uid, thisItem.item_id, rollResult);
                const item = await service.items.getItem(rollResult);
                if (!item) {
                    await confirmation.update({
                        embeds: [...confirmation.message.embeds,
                            confirmedEmbed(diffBlock(`- OPERATION FAILED-\nAn error occurred: item not found.`), config.colors.blue)
                        ], components: []
                    });
                    return;
                }

                const files: AttachmentBuilder[] = [];
                const newItemEmbed = new EmbedBuilder()
                    .setColor(config.colors.blue)
                    .setTitle(`You Obtained: ${item.name}`)
                    .setDescription(diffBlock(`Rarity: ${item.rarity || "None"}`))
                    .setTimestamp(new Date());
                const newItemImage = await getItemImage(item, null);
                if (newItemImage) {
                    files.push(newItemImage);
                    newItemEmbed.setImage(`attachment://item.png`);
                }

                await confirmation.update({
                    embeds: [newItemEmbed],
                    components: [],
                    files
                })
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
        identifier: "open-booster-pack"
    }
};

module.exports = pullPair;