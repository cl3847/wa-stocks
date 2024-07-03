import CommandType from "../../types/CommandType";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    CacheType,
    ChatInputCommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder
} from "discord.js";
import Service from "../../services/Service";
import {confirmedEmbed, diffBlock, getItemImage} from "../../utils/helpers";
import config from "config";
import HeldItem from "../../types/HeldItem";
import actions from "../../items/items.controller";

const command: CommandType = {
    data: new SlashCommandBuilder()
        .setName('item')
        .setDescription('Allows you to interact with an item in your inventory.')
        .addStringOption(option =>
                option
                    .setName('id')
                    .setDescription('The id of the item')
                    .setRequired(true),
            //.addChoices(Service.stockTickerList.map(ticker => ({ name: ticker, value: ticker })))
        ),
    async execute(interaction: ChatInputCommandInteraction<CacheType>) {
        const itemId = interaction.options.getString('id', true).toUpperCase();

        const service = Service.getInstance();
        const userPortfolio = await service.users.getUserPortfolio(interaction.user.id);
        if (!userPortfolio) {
            await interaction.reply({embeds: [confirmedEmbed(diffBlock(`- LOOKUP FAILED -\nUser ${interaction.user.username}'s profile does not exist.`), config.colors.blue)]});
            return;
        }
        const inventory = await service.users.getUserInventory(interaction.user.id);
        const itemHolding = inventory.find(item => item.item_id === itemId);
        if (!itemHolding) {
            await interaction.reply({embeds: [confirmedEmbed(diffBlock(`- LOOKUP FAILED -\nYou do not have an item with this ID.`), config.colors.blue)]});
            return;
        }

        const embed = generateItemEmbed(itemHolding);
        const files = [];
        const itemAttachment = await getItemImage(itemHolding, interaction.user.username);
        if (itemAttachment) {
            files.push(itemAttachment);
            embed.setImage(`attachment://item.png`);
        }

        const components = [];
        const componentButtons: ButtonBuilder[] = [];
        for (const action of actions.get(itemId) || []) {
            const newComponentButton = new ButtonBuilder()
                .setCustomId(action.identifier)
                .setLabel(action.name)
                .setStyle(ButtonStyle.Secondary);
            componentButtons.push(newComponentButton);
        }
        if (componentButtons.length > 0) {
            const row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(...componentButtons);
            components.push(row);
        }

        const response = await interaction.reply({embeds: [embed], files, components});
        try {
            const confirmation = await response.awaitMessageComponent({
                filter: i => i.user.id === interaction.user.id,
                time: 60_000
            });
            actions.get(itemId)!.find(a => a.identifier === confirmation.customId)?.execute(confirmation, itemHolding, userPortfolio);
        } catch (e) {
            await response.edit({
                embeds: [embed,
                    confirmedEmbed(diffBlock(`- PURCHASE CANCELLED -\nNo trade confirmation received.`), config.colors.blue)
                ], files, components: []
            });
        }
    },
};

const generateItemEmbed = (itemHolding: HeldItem): EmbedBuilder => {
    return new EmbedBuilder()
        .setTitle(`Item: ${itemHolding.name}`)
        .setDescription(diffBlock(`Rarity: ${itemHolding.rarity || "None"}\nQuantity: ${itemHolding.quantity}`))
        .setColor(config.colors.blue)
        .setTimestamp(new Date());
};

module.exports = command;