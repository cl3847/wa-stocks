import Service from "../services/Service";
import log from "./logger";
import Item from "../models/item/Item";
import MissingCreditCardError from "../models/error/MissingCreditCardError";
import config from "../../config";
import {Client} from "discord.js"

const rewardConfig = {
    cardDistribution: [
        //{group: 0.015625, item: "060", limitBump: 100000000, weeklyRewards: [{item: "900", quantity: 15}], role: "1268354078816211065"}, // centurion
        //{group: 0.03125, item: "050", limitBump: 50000000, weeklyRewards: [{item: "900", quantity: 10}], role: "1268354002471489546"}, // platinum
        //{group: 0.0625, item: "040", limitBump: 30000000, weeklyRewards: [{item: "900", quantity: 5}], role: "1268353922129596467"}, // white gold
        {group: 0.125, item: "030", limitBump: 15000000, weeklyRewards: [{item: "900", quantity: 3}], role: "1268353735390662687"}, // rose gold
        {group: 0.25, item: "020", limitBump: 10000000, weeklyRewards: [{item: "900", quantity: 2}], role: "1268348633624084632"}, // gold
        {group: 0.5, item: "010", limitBump: 5000000, weeklyRewards: [{item: "900", quantity: 1}], role: "1268348167456428043"}, // green
        {group: 1, item: "000", limitBump: 0, weeklyRewards: [], role: "1267307202927132794"} // blue
    ]
};


async function assignCreditCards() {
    const service = Service.getInstance();
    const users = await service.users.getAllUserPortfolios();
    const usersAboveStartingBalance = users.filter(x => x.netWorth() > config.game.startingBalance);
    const usersBelowStartingBalance = users.filter(x => x.netWorth() <= config.game.startingBalance);
    const updated= [];
    for (let i = 0; i < usersAboveStartingBalance.length; i++) {
        const user = usersAboveStartingBalance[i]!;
        let newCardId = rewardConfig.cardDistribution[rewardConfig.cardDistribution.length - 1]!.item;
        for (let j = 0; j < rewardConfig.cardDistribution.length; j++) {
            if (i < usersAboveStartingBalance.length * rewardConfig.cardDistribution[j]!.group && user.netWorth() > config.game.startingBalance) {
                newCardId = rewardConfig.cardDistribution[j]!.item;
                break;
            }
        }
        try {
            const isUpdated = await service.users.updateCreditCard(user.uid, newCardId);
            if (isUpdated) updated.push(user.uid);
        } catch (err) {
            log.error(`Could not update ${user.uid}'s credit card to ${newCardId}`);
        }
    }
    for (let i = 0; i < usersBelowStartingBalance.length; i++) {
        const user = usersBelowStartingBalance[i]!;
        try {
            const isUpdated = await service.users.updateCreditCard(user.uid, "000");
            if (isUpdated) updated.push(user.uid);
        } catch (err) {
            log.error(`Could not update ${user.uid}'s credit card to 000`);
        }
    }
    return updated;
}

async function assignRewards() {
    const service = Service.getInstance();
    const users = await service.users.getAllUserPortfolios();
    for (let user of users) {
        const inventory = await service.users.getUserInventory(user.uid);
        const currentCard = inventory.find((x: Item) => x.type === "credit_card");
        if (!currentCard) throw new MissingCreditCardError(user.uid);

        const myCardRewards = rewardConfig.cardDistribution.find(x => x.item === currentCard.item_id);
        if (!myCardRewards) continue;
        const cli = myCardRewards.limitBump;
        const newItems: {item: string, quantity: number}[] = myCardRewards.weeklyRewards;
        try {
            await service.users.updateUser(user.uid, {credit_limit: user.credit_limit + cli});
            log.success(`Increased ${user.uid}'s credit limit from ${user.credit_limit } to ${user.credit_limit + cli}`);
            for (let item of newItems) {
                let currentItem = (await service.users.getItemHolding(user.uid, item.item));
                if (!currentItem) {
                    await service.users.createItemHolding({uid: user.uid, item_id: item.item, quantity: item.quantity});
                } else {
                    await service.users.updateItemHolding(user.uid, item.item, {quantity: currentItem.quantity + item.quantity})
                }
                log.success(`Gave ${user.uid} ${item.quantity} of ${item.item}`);
            }
        } catch (err) {
            log.error(`Failed to apply rewards to ${user.uid}: ` + err);
        }

    }
}

async function updateRoles(client: Client) {
    const service = Service.getInstance();
    const users = await service.users.getAllUserPortfolios();
    const guild = await client.guilds.fetch(config.bot.guildID);
    const rolesSet = new Set(rewardConfig.cardDistribution.map(x => x.role));
    for (let user of users) {
        try {
            const discordUser = await guild.members.fetch({user: user.uid, force: true});
            const inventory = await service.users.getUserInventory(user.uid);
            const currentCard = inventory.find((x: Item) => x.type === "credit_card");
            if (!currentCard) throw new MissingCreditCardError(user.uid);
            const currentCardRoleId = rewardConfig.cardDistribution.find(x => x.item === currentCard.item_id)?.role;
            if (!currentCardRoleId) continue;
            for (let role of discordUser.roles.cache) {
                if (rolesSet.has(role[0]) && role[0] !== currentCardRoleId) {
                    await discordUser.roles.remove(role[0]);
                    log.success("Removed role " + role[0] + " from " + user.uid)
                }
            }
            if (!discordUser.roles.cache.has(currentCardRoleId)) {
                await discordUser.roles.add(currentCardRoleId);
                log.success("Added role " + currentCardRoleId + " to " + user.uid)
            }
        } catch (err) {
            log.error(err);

        }
    }
}

export {
    assignCreditCards,
    assignRewards,
    updateRoles
}