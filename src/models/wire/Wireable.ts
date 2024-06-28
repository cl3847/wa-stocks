import {CommandInteraction} from "discord.js";
import WireTransaction from "../transaction/WireTransaction";

abstract class Wireable {
    name: string;
    identifier: string;

    protected constructor(name: string, identifier: string) {
        this.name = name;
        this.identifier = identifier;
    }

    async onWire(interaction: CommandInteraction, fromUid: string, amount: number): Promise<void> {
        const confirmation = await this.previewWire(interaction, fromUid, amount);
        confirmation;
        /*if (isConfirmed) {
            const transaction =await this.executeWire(fromUid, amount);
            await this.onSuccess(transaction);
        } else {
            confirmation.update({ embeds: [...embeds,
                    confirmedEmbed(diffBlock(`- PURCHASE CANCELLED -\nOrder for ${quantity} share(s) of ${ticker} cancelled.`), config.colors.blue)
                ], components: [] });
        }*/
    }

    abstract previewWire(interaction: CommandInteraction, fromUid: string, amount: number): Promise<boolean>;
    abstract executeWire(fromUid: string, amount: number): Promise<WireTransaction>;
    abstract onSuccess(transaction: WireTransaction): Promise<void>;
}

export default Wireable;