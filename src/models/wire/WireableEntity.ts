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
import {confirmComponent, confirmedEmbed, diffBlock, dollarize} from "../../utils/helpers";
import config from "../../../config";
import WireRejectionError from "../error/WireRejectionError";

class WireableEntity extends Wireable {
    protected onSuccess: (confirmation: MessageComponentInteraction, fromUser: User, transaction: WireTransaction) => Promise<void>;
    protected checkAcceptWire: (instance: WireableEntity, fromUser: User, amount: number) => Promise<void>;

    thumbnail: LocalThumbnail | null;

    constructor(
        name: string,
        identifier: string,
        thumbnail: LocalThumbnail | null,
        checkAcceptWire: (instance: WireableEntity, fromUser: User, amount: number) => Promise<void>,
        onSuccess: (confirmation: MessageComponentInteraction, fromUser: User, transaction: WireTransaction) => Promise<void>
    ) {
        super(name, identifier);
        this.checkAcceptWire = checkAcceptWire;
        this.onSuccess = onSuccess;
        this.thumbnail = thumbnail;
    }

    protected async executeWire(confirmation: MessageComponentInteraction, fromUser: User, amount: number): Promise<WireTransaction | null> {
        const service = Service.getInstance();
        try {
            await this.checkAcceptWire(this, fromUser, amount);
            return service.transactions.wireToEntity(fromUser.uid, this.identifier, amount);
        } catch (err) {
            if (err instanceof WireRejectionError) {
                const embeds = [];
                const originalEmbed = (await confirmation.message.fetch()).embeds[0];
                if (originalEmbed) embeds.push(originalEmbed);
                embeds.push(confirmedEmbed(diffBlock(`- WIRE REJECTED BY RECIPIENT -\nReason: ${err.message || "No reason provided."}`), config.colors.blue));
                await confirmation.update({
                    embeds, components: [], files: []
                });
            } else {
                throw err;
            }
        }
        return null;
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
