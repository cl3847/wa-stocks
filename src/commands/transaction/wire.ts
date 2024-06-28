import {CacheType, ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";
import CommandType from "../../types/CommandType";
import WireDestinationType from "../../types/WireDestinationType";
import Service from "../../services/Service";
import InsufficientBalanceError from "../../models/error/InsufficientBalanceError";
import {confirmedEmbed, diffBlock, dollarize, logToChannel} from "../../utils/helpers";
import config from "../../../config";
import UserNotFoundError from "../../models/error/UserNotFoundError";

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

        try {
            switch (destinationType) {
                case 'user':
                    const destinationDiscordUser = interaction.options.getUser("target", true);
                    const transactionRecord = await service.transactions.wireToUser(interaction.user.id, destinationDiscordUser.id, amountToTransfer);
                    await interaction.reply(`Placeholder: You wired ${destinationDiscordUser.username} $${dollarize(-transactionRecord.balance_change)}.`);
                    await logToChannel(interaction.client, `🌐 **${interaction.user.username}** wired **${destinationDiscordUser.username}** a total of $${dollarize(-transactionRecord.balance_change)}.`);
            }
        } catch(error) {
            if (error instanceof InsufficientBalanceError) {
                await interaction.reply({ embeds: [confirmedEmbed(diffBlock(`- WIRE FAILED -\nYou do not have enough account balance to transfer this much money.`), config.colors.blue)]});
            } else if (error instanceof UserNotFoundError) {
                await interaction.reply({ embeds: [confirmedEmbed(diffBlock(`- WIRE FAILED -\nYou or the user you are trying to transfer money to does not have an account.`), config.colors.blue)]});
            } else {
                throw error;
            }
        }
    },
};

module.exports = command;