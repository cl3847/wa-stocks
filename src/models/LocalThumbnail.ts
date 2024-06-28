import {AttachmentBuilder} from "discord.js";

type LocalThumbnail = {
    file: AttachmentBuilder;
    url: string;
}

export default LocalThumbnail;