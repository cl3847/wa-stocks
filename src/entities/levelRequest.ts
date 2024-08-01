import WireableEntity from "../models/wire/WireableEntity";
import config from "../../config";
import {confirmedEmbed, diffBlock, dollarize, logToChannel} from "../utils/helpers";
import {MessageComponentInteraction} from "discord.js";
import WireTransaction from "../models/transaction/WireTransaction";
import User from "../models/user/User";
import WireRejectionError from "../models/error/WireRejectionError";
import Service from "../services/Service";

function parseLid(memo: string | null): string | null {
    if (!memo) return null;
    const parsedId = parseInt(memo, 10);
    if (parsedId.toString() !== memo || isNaN(parsedId)) {
        return null;
    }
    return parsedId.toString();
}

const levelRequestEntity = new WireableEntity(
    "Level Request Tool",
    "REQ",
null,
    async (instance: WireableEntity, fromUser: User, amount: number, memo: string | null): Promise<void> => {
        const userPortfolio = await Service.getInstance().users.getUserPortfolio(fromUser.uid);
        if (userPortfolio!.netWorth() - amount < config.game.minHeldWire) {
            throw new WireRejectionError(fromUser, instance,`You can't send a balance to the level request tool that would drop your net worth under $${dollarize(config.game.minHeldWire)}.`);
        }
        if (amount < config.game.minimumLevelRequestAmount) {
            throw new WireRejectionError(fromUser, instance, `You can't send less than the minimum of $${dollarize(config.game.minimumLevelRequestAmount)} to the level request tool.`);
        }
        const parsedId = parseLid(memo);
        if (!parsedId || parseInt(parsedId, 10) < 128 || parseInt(parsedId, 10) > config.game.maxRequestId) {
            throw new WireRejectionError(fromUser, instance, `Invalid level ID provided. ID must be an integer between 128 and ${config.game.maxRequestId}.`);
        }
        return;
    },
    async (confirmation: MessageComponentInteraction, _: User, transaction: WireTransaction) => {
        const service = Service.getInstance();

        const levelId = parseLid(transaction.memo!)!;
        const lvlReq = await service.transactions.contributeToPool(levelId, -transaction.balance_change);

        const successEmbed = confirmedEmbed(diffBlock(`+ WIRE SUCCESSFUL +\n$${dollarize(-transaction.balance_change)} contributed to the request bounty for the level with ID ${levelId}.`) + diffBlock(
            `  $${dollarize(lvlReq.bounty - (-transaction.balance_change))} previous bounty\n` +
            `+ $${dollarize(-transaction.balance_change)} wire amount\n` +
            `= $${dollarize(lvlReq.bounty)} current bounty\n`
        ), config.colors.blue);

        await confirmation.update({
            embeds: [...confirmation.message.embeds, successEmbed],
            components: [],
            files: []
        });
        await logToChannel(confirmation.client, `🌐 **${confirmation.user.username}** wired the Level Request Tool a total of $${dollarize(-transaction.balance_change)}.\n` +
            `💰 **${confirmation.user.username}** contributed $${dollarize(-transaction.balance_change)} to the request bounty for the level with ID \`${levelId}!\``);
    }
);

module.exports = levelRequestEntity;