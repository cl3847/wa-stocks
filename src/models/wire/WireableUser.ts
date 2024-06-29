import User from "../user/User";
import Wireable from "./Wireable";
import WireTransaction from "../transaction/WireTransaction";
import {
    ButtonStyle,
    CommandInteraction,
    EmbedBuilder,
    InteractionResponse,
    MessageComponentInteraction
} from "discord.js";
import {confirmComponent, confirmedEmbed, diffBlock, dollarize, logToChannel} from "../../utils/helpers";
import config from "../../../config";
import Service from "../../services/Service";

class WireableUser extends Wireable implements User {
    uid: string;
    balance: number;
    loan_balance: number;
    credit_limit: number;

    avatarUrl: string | null;

    constructor(user: User, username: string, avatarUrl?: string | null) {
        super(username, user.uid);
        Object.assign(this, user);
        this.avatarUrl = avatarUrl || null;
    }

    protected async executeWire(_: MessageComponentInteraction, fromUser: User, amount: number): Promise<WireTransaction> {
        const service = Service.getInstance();
        return service.transactions.wireToUser(fromUser.uid, this.uid, amount);
    }

    protected async onSuccess(confirmation: MessageComponentInteraction, _: User, transaction: WireTransaction): Promise<void> {
        await confirmation.update({
            embeds: [...confirmation.message.embeds,
                confirmedEmbed(diffBlock(`+ WIRE SUCCESSFUL +\nYou wired ${this.name} a total of $${dollarize(-transaction.balance_change)}.`), config.colors.blue)
            ], components: []
        });
        await logToChannel(confirmation.client, `🌐 **${confirmation.user.username}** wired **${this.name}** a total of $${dollarize(-transaction.balance_change)}.`);
    }

    protected async previewWire(interaction: CommandInteraction, fromUser: User, amount: number): Promise<InteractionResponse<boolean>> {
        const embed = new EmbedBuilder()
            .setTitle('Confirm Wire Transfer')
            .setDescription(diffBlock(
                `Destination: ${this.name}\n\n` +
                `  $${dollarize(fromUser.balance)} current balance\n` +
                `- $${dollarize(amount)} wire amount\n` +
                `= $${dollarize(fromUser.balance - amount)} final balance\n`
            ))
            .setColor(config.colors.red)
            .setTimestamp(new Date())
            .setThumbnail(this.avatarUrl);
        return interaction.reply({embeds: [embed], components: [confirmComponent('Confirm Wire', ButtonStyle.Danger)]});
    }
}

export default WireableUser;
