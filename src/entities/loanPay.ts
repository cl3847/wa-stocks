import WireableEntity from "../models/wire/WireableEntity";
import config from "../../config";
import {confirmedEmbed, diffBlock, dollarize, getStockLogo, logToChannel} from "../utils/helpers";
import {MessageComponentInteraction} from "discord.js";
import WireTransaction from "../models/transaction/WireTransaction";
import User from "../models/user/User";
import WireRejectionError from "../models/error/WireRejectionError";
import Service from "../services/Service";

const thumbnailAttachment = getStockLogo(config.theme.financialCompanyTicker);

const loanPayEntity = new WireableEntity(
    config.theme.financialCompanyName,
    config.theme.financialCompanyTicker,
    thumbnailAttachment ? {
        url: `attachment://logo.png`,
        file: thumbnailAttachment
    } : null,
    async (instance: WireableEntity, fromUser: User, amount: number): Promise<void> => {
        if (fromUser.loan_balance < amount) {
            throw new WireRejectionError(fromUser, instance,`You only owe $${dollarize(fromUser.loan_balance)}, but sent more than what you owe.`);
        }
        return;
    },
    async (confirmation: MessageComponentInteraction, fromUser: User, transaction: WireTransaction) => {
        // TODO possible try block here
        const service = Service.getInstance();

        await service.users.updateUser(fromUser.uid, {loan_balance: fromUser.loan_balance + transaction.balance_change});

        const successEmbed = confirmedEmbed(diffBlock(`+ WIRE SUCCESSFUL +\n${config.theme.financialCompanyName} accepted your payment of $${dollarize(-transaction.balance_change)}.`) + diffBlock(
            `  $${dollarize(fromUser.loan_balance)} previous debt\n` +
            `- $${dollarize(-transaction.balance_change)} wire amount\n` +
            `= $${dollarize(fromUser.loan_balance + transaction.balance_change)} current debt\n`
        ), config.colors.blue)

        await confirmation.update({
            embeds: [...(await confirmation.message.fetch()).embeds, successEmbed],
            components: [],
            files: []
        });
        await logToChannel(confirmation.client, `🌐 **${confirmation.user.username}** wired **${config.theme.financialCompanyName}** a total of $${dollarize(-transaction.balance_change)}.\n` +
            `🏦 **${confirmation.user.username}** paid off $${dollarize(-transaction.balance_change)} of their debt, ${fromUser.loan_balance + transaction.balance_change === 0 ? "with no debt remaining! 🎉" : `with $${dollarize(fromUser.loan_balance + transaction.balance_change)} of debt remaining.`}`);
    }
);

module.exports = loanPayEntity;