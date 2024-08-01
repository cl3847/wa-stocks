import {CacheType, ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";
import CommandType from "../../types/CommandType";
import WireDestinationType from "../../types/WireDestinationType";
import Service from "../../services/Service";
import InsufficientBalanceError from "../../models/error/InsufficientBalanceError";
import {confirmedEmbed, diffBlock, dollarize} from "../../utils/helpers";
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
                )
                .addStringOption(option =>
                    option
                        .setName('memo')
                        .setDescription('A memo to attach to the wire transfer')
                        .setRequired(false)
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
                )
                .addStringOption(option =>
                    option
                        .setName('memo')
                        .setDescription('A memo to attach to the wire transfer')
                        .setRequired(false)
                ),
        ),
    async execute(interaction: ChatInputCommandInteraction<CacheType>) {
        const service = Service.getInstance();
        const destinationType = interaction.options.getSubcommand() as WireDestinationType;
        const amountToTransfer = interaction.options.getInteger('balance', true);
        const memo = interaction.options.getString('memo', false);

        if (amountToTransfer < 1) {
            await interaction.reply({embeds: [confirmedEmbed(diffBlock(`- WIRE FAILED -\nYou must transfer at least $0.01.`), config.colors.blue)], ephemeral: true});
            return;
        }
        const user = await service.users.getUserPortfolio(interaction.user.id);
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
                    if (target.id === interaction.user.id) {
                        await interaction.reply({embeds: [confirmedEmbed(diffBlock(`- WIRE FAILED -\nYou can't wire money to yourself.`), config.colors.blue)], ephemeral: true});
                        return;
                    }

                    // don't allow a transfer if the user's net worth would be less than 100k
                    if (user.netWorth() - amountToTransfer < config.game.minHeldWire) {
                        await interaction.reply({embeds: [confirmedEmbed(diffBlock(`- WIRE FAILED -\nYou can't send a balance to another user that would drop your net worth under $${dollarize(config.game.minHeldWire)}.`), config.colors.blue)], ephemeral: true});
                        return;
                    }

                    const destUser = await service.users.getUser(target.id);
                    if (!destUser) {
                        await interaction.reply({embeds: [confirmedEmbed(diffBlock(`- WIRE FAILED -\nThe user you are trying to transfer money to does not have an account.`), config.colors.blue)], ephemeral: true});
                        return;
                    }
                    const destUserWireable = new WireableUser(destUser, target.username, target.avatarURL());
                    await destUserWireable.onWire(interaction, user, amountToTransfer, memo);
                    break;
                case 'entity':
                    const entityIdentifier = interaction.options.getString('target', true).toUpperCase();
                    const destEntity = entities.get(entityIdentifier);
                    if (!destEntity) {
                        await interaction.reply({embeds: [confirmedEmbed(diffBlock(`- WIRE FAILED -\nThe entity you are trying to transfer money to does not exist.`), config.colors.blue)], ephemeral: true});
                        return;
                    }
                    await destEntity.onWire(interaction, user, amountToTransfer, memo);
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