import User from "../user/User";
import Wireable from "./Wireable";
import WireTransaction from "../transaction/WireTransaction";
import {uid} from "chart.js/helpers";
import user from "../user/User";
import {CommandInteraction} from "discord.js";

class WireableUser extends Wireable implements User {
    uid: string;
    balance: number;
    loan_balance: number;
    credit_limit: number;

    constructor(user: User, username: string, uid: string) {
        super(username, uid);
        Object.assign(this, user);
    }

    executeWire(fromUid: string, amount: number): Promise<WireTransaction> {
        return Promise.resolve(undefined);
    }

    onSuccess(transaction: WireTransaction): Promise<void> {
        return Promise.resolve(undefined);
    }

    previewWire(interaction: CommandInteraction, fromUid: string, amount: number): Promise<boolean> {
        return Promise.resolve(false);
    }
}

export default WireableUser;