import {
    ButtonStyle,
    CacheType,
    ChatInputCommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder
} from "discord.js";
import CommandType from "../../types/CommandType";
import config from "../../../config";
import {confirmComponent, confirmedEmbed, diffBlock, dollarize, logToChannel} from "../../utils/helpers";
import Service from "../../services/Service";

const command: CommandType = {
    data: new SlashCommandBuilder()
        .setName('request')
        .setDescription('MOD ONLY - Manage level requests')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('View a list of all requests, sorted by highest bounty'),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('level')
                .setDescription('See a level\'s request bounty or add to it')
                .addStringOption(option =>
                    option
                        .setName('id')
                        .setDescription('The id of the level you want to view or add a bounty to')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName('balance')
                        .setDescription('The balance of money (IN CENTS) you\'d like to add to the bounty')
                )
        ),
    async execute(interaction: ChatInputCommandInteraction<CacheType>) {
        if (!interaction.guild) return;
        const service = Service.getInstance();
        const user = await service.users.getUserPortfolio(interaction.user.id);
        if (!user) {
            await interaction.reply('You do not have a profile yet. Use /start to begin.');
            return;
        }

        const destinationType = interaction.options.getSubcommand() as "list" | "level";
        switch (destinationType) {
            // list all reqs
            case 'list':
                const requests = await service.transactions.viewRequestPool(10);
                const requestListEmbed = new EmbedBuilder()
                    .setTitle('Top Level Request Bounties')
                    .setDescription(
                        diffBlock(requests.map((r, i) => {
                            return `${i+1}: $${dollarize(r.bounty)} - ${r.name} (${r.level_id}) `
                        }).join('\n') || "All requests cleared.")
                    )
                    .setColor(config.colors.blue);
                await interaction.reply({embeds: [requestListEmbed]});
                break;


            // view or add to a level's request
            case 'level':
                const addBalance = interaction.options.getInteger('balance', false);
                const unparsedId = interaction.options.getString('id', true);
                if (addBalance) { // transfer money into the request
                    if (addBalance < config.game.minimumLevelRequestAmount) {
                        await interaction.reply({embeds: [confirmedEmbed(diffBlock(`- REQUEST FAILED -\nYou must add at least $${dollarize(config.game.minimumLevelRequestAmount)} to the bounty.`), config.colors.blue)], ephemeral: true});
                        return;
                    }
                    if (user.balance < addBalance) {
                        await interaction.reply({embeds: [confirmedEmbed(diffBlock(`- REQUEST FAILED -\nYou do not have enough account balance to transfer this much money.`), config.colors.blue)], ephemeral: true});
                        return;
                    }
                    if (user.netWorth() - addBalance < config.game.minHeldWire) {
                        await interaction.reply({embeds: [confirmedEmbed(diffBlock(`- REQUEST FAILED -\nYou can't add a bounty that would drop your net worth under $${dollarize(config.game.minHeldWire)}.`), config.colors.blue)], ephemeral: true});
                        return;
                    }
                    const parsedId = parseLid(unparsedId);
                    if (!parsedId || parseInt(parsedId, 10) < 128 || parseInt(parsedId, 10) > config.game.maxRequestId) {
                        await interaction.reply({embeds: [confirmedEmbed(diffBlock(`- REQUEST FAILED -\nInvalid level ID provided. ID must be an integer between 128 and ${config.game.maxRequestId}.`), config.colors.blue)], ephemeral: true});
                        return;
                    }
                    const bountyConfirmEmbed = new EmbedBuilder()
                        .setTitle(`Confirm Contribution to Bounty`)
                        .setDescription(diffBlock(
                            `Level ID: ${parsedId}\n\n` +
                            `  $${dollarize(user.balance)} current balance\n` +
                            `- $${dollarize(addBalance)} bounty contribution\n` +
                            `= $${dollarize(user.balance - addBalance)} final balance\n`
                        ))
                        .setColor(config.colors.blue);
                    const row = confirmComponent("Confirm Contribution", ButtonStyle.Success);
                    const embeds = [bountyConfirmEmbed];
                    const response = await interaction.reply({
                        embeds,
                        components: [row],
                    });
                    try {
                        const confirmation = await response.awaitMessageComponent({
                            filter: i => i.user.id === interaction.user.id,
                            time: 20_000
                        });
                        if (confirmation.customId === 'confirm') {
                            try {
                                const transactionRecord = await service.transactions.contributeBounty(user.uid, parsedId, addBalance);
                                const cashbackAmount = transactionRecord.price + transactionRecord.balance_change;
                                await confirmation.update({
                                    embeds: [...embeds,
                                        confirmedEmbed(diffBlock(`+ CONTRIBUTION SUCCESSFUL +\n$${dollarize(addBalance)} has been added to the bounty for level ${parsedId}.` +
                                            (cashbackAmount > 0 ? `\nYou received $${dollarize(cashbackAmount)} cashback!` : "")
                                        ), config.colors.blue)
                                    ], components: [],
                                });
                                await logToChannel(interaction.client, `👇 **${interaction.user.username}** added $${dollarize(addBalance)} to the bounty for level \`${parsedId}\`.`);
                            } catch (err) {
                                await confirmation.update({
                                    embeds: [...embeds,
                                        confirmedEmbed(diffBlock(`- CONTRIBUTION FAILED -\nAn error occurred while trying to add to the bounty.`), config.colors.blue)
                                    ], components: [],
                                });
                            }
                        } else if (confirmation.customId === 'cancel') {
                            await confirmation.update({embeds: [...embeds], components: []});
                        }
                    } catch (e) {
                        await response.edit({embeds: [...embeds,], components: []});
                    }


                // view request and potentially take it
                } else {
                    const request = await service.transactions.getRequest(unparsedId);
                    if (!request) {
                        await interaction.reply({embeds: [confirmedEmbed(diffBlock(`- LOOKUP FAILED -\nA request for this level does not yet exist.`), config.colors.blue)]});
                        return;
                    }

                    let desc = `Bounty: $${dollarize(request.bounty)}\nLevel: ${request.name || "N/A"} by ${request.creator || "N/A"}`;
                    desc += (request.bounty === 0) ? `\n- This request has been processed by a moderator.` : `\n+ This request is still pending a review.`;
                    const discordUser = await interaction.guild.members.fetch({user: interaction.user.id, force: true});
                    const isMod = discordUser.roles.cache.has(config.bot.modRoleId);
                    const modCommissionAmount = Math.ceil(request.bounty * config.game.modCommission);
                    if (isMod) desc += `\n\nCurrent Mod Commission: ${Math.floor(config.game.modCommission * 100)}%\nYou earn $${dollarize(modCommissionAmount)} for processing this request.`;
                    let requesterStr = request.requester_uid ? `<@${request.requester_uid}>` : "**Unknown user, check logs.**";

                    const requestEmbed = new EmbedBuilder()
                        .setTitle(`Request for Level ${request.level_id}`)
                        .setDescription(`Requester: ${requesterStr}` + diffBlock(desc))
                        .setColor(config.colors.blue);

                    if (isMod && request.bounty > 0) {
                        const embeds = [requestEmbed];
                        const row = confirmComponent("Take Request", ButtonStyle.Success);
                        const response = await interaction.reply({
                            embeds,
                            components: [row],
                        });
                        try {
                            const confirmation = await response.awaitMessageComponent({
                                filter: i => i.user.id === interaction.user.id,
                                time: 20_000
                            });
                            if (confirmation.customId === 'confirm') {
                                try {
                                    const transactionRecord = await service.transactions.acceptBounty(interaction.user.id, request.level_id);
                                    const commissionFinalAmount = transactionRecord.balance_change;
                                    await confirmation.update({
                                        embeds: [...embeds,
                                            confirmedEmbed(diffBlock(`+ BOUNTY CLAIMED +\n$${dollarize(commissionFinalAmount)} has been added to your account. Please be sure to review the level!`), config.colors.blue)
                                        ], components: [],
                                    });
                                    await logToChannel(interaction.client, `✅ **${interaction.user.username}** claimed the level request bounty for \`${request.level_id}\` and earned $${dollarize(commissionFinalAmount)}.`);
                                } catch (err) {
                                    await confirmation.update({
                                        embeds: [...embeds,
                                            confirmedEmbed(diffBlock(`- CLAIM FAILED -\nAn error occurred while trying to accept this request.`), config.colors.blue)
                                        ], components: [],
                                    });
                                }
                            } else if (confirmation.customId === 'cancel') {
                                await confirmation.update({embeds: [...embeds], components: []});
                            }
                        } catch (e) {
                            await response.edit({embeds: [...embeds,], components: []});
                        }
                    } else {
                        await interaction.reply({embeds: [requestEmbed]});
                    }
                }
                break;
        }
    },
};

function parseLid(unparsedId: string): string | null {
    if (!unparsedId) return null;
    const parsedId = parseInt(unparsedId, 10);
    if (parsedId.toString() !== unparsedId || isNaN(parsedId)) {
        return null;
    }
    return parsedId.toString();
}

module.exports = command;