import Wireable from "./Wireable";
import {
    AttachmentBuilder,
    ButtonStyle,
    CommandInteraction,
    EmbedBuilder,
    InteractionResponse,
    MessageComponentInteraction
} from "discord.js";
import WireTransaction from "../transaction/WireTransaction";
import LocalThumbnail from "../LocalThumbnail";
import Service from "../../services/Service";
import User from "../user/User";
import {confirmComponent, diffBlock, dollarize} from "../../utils/helpers";
import config from "../../../config";

class WireableEntity extends Wireable {
    onSuccess: (confirmation: MessageComponentInteraction, transaction: WireTransaction) => Promise<void>;
    thumbnail: LocalThumbnail | null;

    constructor(
        name: string,
        identifier: string,
        thumbnail: LocalThumbnail | null,
        onSuccess: (confirmation: MessageComponentInteraction, transaction: WireTransaction) => Promise<void>
    ) {
        super(name, identifier);
        this.onSuccess = onSuccess;
        this.thumbnail = thumbnail;
    }

    protected executeWire(fromUser: User, amount: number): Promise<WireTransaction> {
        const service = Service.getInstance();
        return service.transactions.wireToEntity(fromUser.uid, this.identifier, amount);
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
            .setTimestamp(new Date());

        let files: AttachmentBuilder[] = [];
        if (this.thumbnail) {
            files.push(this.thumbnail.file);
            embed.setThumbnail(this.thumbnail.url);
        }
        return interaction.reply({
            embeds: [embed],
            files,
            components: [confirmComponent('Confirm Wire', ButtonStyle.Danger)]
        });
    }
}

export default WireableEntity;
