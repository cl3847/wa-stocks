import {CommandInteraction, InteractionResponse, MessageComponentInteraction} from "discord.js";
import WireTransaction from "../transaction/WireTransaction";
import {confirmedEmbed, diffBlock, dollarize} from "../../utils/helpers";
import config from "../../../config";
import User from "../user/User";
import Service from "../../services/Service";

abstract class Wireable {
    name: string;
    identifier: string;

    protected constructor(name: string, identifier: string) {
        this.name = name;
        this.identifier = identifier;
    }

    async onWire(interaction: CommandInteraction, fromUser: User, amount: number, memo: string | null): Promise<void> {
        const response = await this.previewWire(interaction, fromUser, amount, memo);
        try {
            const confirmation = await response.awaitMessageComponent({
                filter: i => i.user.id === interaction.user.id,
                time: 60_000
            });

            if (confirmation.customId === 'confirm') {
                const service = Service.getInstance();
                const updatedFromUser = await service.users.getUser(fromUser.uid);
                if (!updatedFromUser) {
                    await confirmation.update(
                        {
                            embeds: [
                                confirmedEmbed(diffBlock(`- WIRE FAILED -\nError fetching user data.`), config.colors.blue)
                            ],
                            components: [],
                            files: []
                        });
                    return;
                }
                const transaction = await this.executeWire(confirmation, updatedFromUser, amount, memo);
                if (!transaction) return;
                await this.onSuccess(confirmation, updatedFromUser, transaction);
            } else if (confirmation.customId === 'cancel') {
                await confirmation.update(
                    {
                        embeds: [
                            confirmedEmbed(diffBlock(`- WIRE CANCELLED -\nOrder to wire ${this.name} a total of $${dollarize(amount)} cancelled.`), config.colors.blue)
                        ],
                        components: [],
                        files: []
                    });
            }
        } catch (e) {
            await response.edit({
                embeds: [
                    confirmedEmbed(diffBlock(`- WIRE CANCELLED -\nNo transfer confirmation received.`), config.colors.blue)
                ], components: [], files: []
            });
        }
    }

    protected abstract previewWire(interaction: CommandInteraction, fromUid: User, amount: number, memo: string | null): Promise<InteractionResponse<boolean>>;

    protected abstract executeWire(confirmation: MessageComponentInteraction, fromUser: User, amount: number, memo: string | null): Promise<WireTransaction | null>;

    protected abstract onSuccess(confirmation: MessageComponentInteraction, fromUser: User, transaction: WireTransaction): Promise<void>;
}

export default Wireable;