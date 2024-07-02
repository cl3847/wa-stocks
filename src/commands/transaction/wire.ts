import {CacheType, ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";
import CommandType from "../../types/CommandType";
import WireDestinationType from "../../types/WireDestinationType";
import Service from "../../services/Service";
import InsufficientBalanceError from "../../models/error/InsufficientBalanceError";
import {confirmedEmbed, diffBlock} from "../../utils/helpers";
import config from "../../../config";
import UserNotFoundError from "../../models/error/UserNotFoundError";
import WireableUser from "../../models/wire/WireableUser";
import entities from "../../entities/entities.controller";

const command: CommandType = {
    data: new SlashCommandBuilder()
        .setName('wire')
        .setDescription('Wire money from yourself to another user or entity')
        .addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('Send money to a user')
                .addUserOption(option =>
                    option
                        .setName('target')
                        .setDescription('The user to send money to')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName('balance')
                        .setDescription('The balance of money (IN CENTS) you\'d like to transfer')
                        .setRequired(true)
                ),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('entity')
                .setDescription('Send money to an entity')
                .addStringOption(option =>
                    option
                        .setName('target')
                        .setDescription('The entity to send money to')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName('balance')
                        .setDescription('The balance of money (IN CENTS) you\'d like to transfer')
                        .setRequired(true)
                ),
        ),
    async execute(interaction: ChatInputCommandInteraction<CacheType>) {
        const service = Service.getInstance();
        const destinationType = interaction.options.getSubcommand() as WireDestinationType;
        const amountToTransfer = interaction.options.getInteger('balance', true);
        if (amountToTransfer < 1) {
            await interaction.reply({embeds: [confirmedEmbed(diffBlock(`- WIRE FAILED -\nYou must transfer at least $0.01.`), config.colors.blue)], ephemeral: true});
            return;
        }
        const user = await service.users.getUser(interaction.user.id);
        if (!user) {
            await interaction.reply({embeds: [confirmedEmbed(diffBlock(`- WIRE FAILED -\nYou do not have an account.`), config.colors.blue)], ephemeral: true});
            return;
        }
        if (user.balance < amountToTransfer) {
            await interaction.reply({embeds: [confirmedEmbed(diffBlock(`- WIRE FAILED -\nYou do not have enough account balance to transfer this much money.`), config.colors.blue)], ephemeral: true});
            return;
        }

        try {
            switch (destinationType) {
                case 'user':
                    const target = interaction.options.getUser('target', true);
                    const destUser = await service.users.getUser(target.id);
                    if (!destUser) {
                        await interaction.reply({embeds: [confirmedEmbed(diffBlock(`- WIRE FAILED -\nThe user you are trying to transfer money to does not have an account.`), config.colors.blue)], ephemeral: true});
                        return;
                    }
                    const destUserWireable = new WireableUser(destUser, target.username, target.avatarURL());
                    await destUserWireable.onWire(interaction, user, amountToTransfer);
                    break;
                case 'entity':
                    const entityIdentifier = interaction.options.getString('target', true).toUpperCase();
                    const destEntity = entities.get(entityIdentifier);
                    if (!destEntity) {
                        await interaction.reply({embeds: [confirmedEmbed(diffBlock(`- WIRE FAILED -\nThe entity you are trying to transfer money to does not exist.`), config.colors.blue)], ephemeral: true});
                        return;
                    }
                    await destEntity.onWire(interaction, user, amountToTransfer);
                    break;
            }
        } catch (error) {
            if (error instanceof InsufficientBalanceError) {
                await interaction.reply({embeds: [confirmedEmbed(diffBlock(`- WIRE FAILED -\nYou do not have enough account balance to transfer this much money.`), config.colors.blue)], ephemeral: true});
            } else if (error instanceof UserNotFoundError) {
                await interaction.reply({embeds: [confirmedEmbed(diffBlock(`- WIRE FAILED -\nYou or the user you are trying to transfer money to does not have an account.`), config.colors.blue)], ephemeral: true});
            } else {
                throw error;
            }
        }
    },
};

module.exports = command;