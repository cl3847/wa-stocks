import Service from "../services/Service";
import StockNotFoundError from "../models/error/StockNotFoundError";
import {
    ActionRowBuilder,
    AttachmentBuilder,
    ButtonBuilder,
    ButtonStyle,
    CacheType,
    Client,
    CommandInteraction,
    EmbedBuilder,
    Message,
    TextChannel
} from "discord.js"
import config from "../../config";
import fs from "fs";
import log from "./logger";
import Item from "../models/item/Item";
import {createCanvas, loadImage} from "canvas";

const PADDING = "————————————————————————————————————————————\n";
const SHORT_PADDING = "———————————————————————————————————\n";
const EMBED_PADDING = "————————————————————————————————————————\n";

function dollarize(cents: number) {
    return (cents / 100).toFixed(2);
}

function getDateStringETC() {
    const date = new Date();
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'America/New_York'
    });
}

function getETCComponents(): { year: number, month: number, date: number } {
    const dateString = new Date().toLocaleString('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    });
    const [month, date, year] = dateString.split('/').map(Number);
    if (!year || !month || !date) throw new Error('Error parsing date components.');
    return {year, month, date};
}

function timestampToETCComponents(timestamp: number): { year: number, month: number, date: number } {
    const d = new Date(timestamp);
    const dateString = d.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    });
    const [month, date, year] = dateString.split('/').map(Number);
    if (!year || !month || !date) throw new Error('Error parsing date components.');
    return {year, month, date};
}

function formatDate(year: number, month: number, day: number): string {
    // Create a new Date object. Note that months are zero-indexed in JavaScript and TypeScript (0 = January, 11 = December)
    const date = new Date(year, month - 1, day);

    // Options for toLocaleDateString to format the date as 'Month day, Year'
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };

    // Format the date using toLocaleDateString with options
    return date.toLocaleDateString('en-US', options);
}

function getTimeStringEST() {
    // Create a new Date object for the current time
    const now = new Date();

    // Get the time in EST formatted as a string
    return now.toLocaleTimeString('en-US', {
        timeZone: 'America/New_York', // EST including handling for EDT automatically
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
}

function getNextMidnightTimestampET(year: number, month: number, day: number): number {
    // Create date object for given date, assuming it's in UTC
    const date = new Date(Date.UTC(year, month - 1, day));

    // Add one day
    date.setUTCDate(date.getUTCDate() + 1);

    // Set UTC time to what would be midnight Eastern Time, accounting for either standard or daylight saving time
    const etOffset = isDstObserved(date) ? -4 : -5; // Eastern Time offset from UTC (-4 for EDT, -5 for EST)
    date.setUTCHours(etOffset * -1, 0, 0, 0);

    // Convert to UTC milliseconds
    return date.getTime();
}

function isDstObserved(date: Date): boolean {
    // January and July dates to determine the standard time offset vs. the current offset
    const jan = new Date(date.getFullYear(), 0, 1); // January 1
    const jul = new Date(date.getFullYear(), 6, 1); // July 1

    // Standard time offset (should be the greatest absolute value)
    const standardOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());

    // Return true if current date offset is less than standard time offset
    return date.getTimezoneOffset() < standardOffset;
}

function getETCComponentsPreviousDay(): { year: number, month: number, date: number } {
    const now = new Date();
    const previousDay = new Date(now.setDate(now.getDate() - 1));
    const dateString = previousDay.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    });
    const [month, date, year] = dateString.split('/').map(Number);
    if (!year || !month || !date) throw new Error('Error parsing date components.');
    return {year, month, date};
}

async function chooseRandomStocks(n: number) {
    const service = Service.getInstance();
    const allStocks = await service.stocks.getAllStocks();
    if (n > allStocks.length) n = allStocks.length;
    const shuffled = allStocks.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);

}

async function stockPriceRandomWalk(ticker: string, volatility: number) {
    const service = Service.getInstance();
    const stock = await service.stocks.getStock(ticker);
    if (!stock) throw new StockNotFoundError(ticker);

    const rnd = Math.random();
    let change_percent = 2 * volatility * rnd;
    if (change_percent > volatility) change_percent -= (2 * volatility);
    let change_amount = stock.price * change_percent;

    if (change_amount > 0) change_amount *= config.game.randomWalkBias;
    

    let new_price = Math.floor(stock.price + change_amount);
    if (new_price < config.game.minimumStockPrice) new_price = config.game.minimumStockPrice;
    await service.stocks.updateStock(ticker, {price: new_price});
}

function diffBlock(s: string) {
    return `\`\`\`diff\n${s}\n\`\`\``;
}

function getStockLogo(ticker: string, filename: string = "logo.png"): AttachmentBuilder | null {
    if (fs.existsSync('assets/stocks/' + ticker + '.png')) {
        return new AttachmentBuilder(`./assets/stocks/${ticker}.png`, {name: filename});
    }
    return null;
}

async function getItemImage(item: Item, username: string | null, filename: string = "item.png"): Promise<AttachmentBuilder | null> {
    if (fs.existsSync('assets/items/' + item.item_id + '.png')) {
        if (item.type !== "credit_card" || !username) {
            return new AttachmentBuilder(`./assets/items/${item.item_id}.png`, {name: filename});
        } else {
            const cardTextColor: { [id: string]: string } = {
                "000": "white",
                "010": "black",
                "020": "black",
                "030": "black",
                "040": "black",
                "050": "DarkGoldenRod",
            };

            const loadedImage = await loadImage(`./assets/items/${item.item_id}.png`);
            const canvas = createCanvas(loadedImage.width, loadedImage.height);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(loadedImage, 0, 0, loadedImage.width, loadedImage.height);
            ctx.font = 'bold 40px Arial, sans-serif';
            ctx.fillStyle = cardTextColor[item.item_id] || "black";
            ctx.fillText(username.toUpperCase(), 80, loadedImage.height-40);
            return new AttachmentBuilder(canvas.toBuffer(), {name: filename});
        }
    }
    return null;
}


function confirmedEmbed(text: string, color: `#${string}`) {
    return new EmbedBuilder()
        .setDescription(text)
        .setColor(color)
        .setTimestamp(new Date());
}

async function logToChannel(client: Client, text: string) {
    if (!config.bot.channels.log) return;
    const channel = await client.channels.fetch(config.bot.channels.log) as TextChannel;
    try {
        await channel.send(text)
    } catch (err) {
        log.error("Error logging event to log channel: " + text)
    }
}

function confirmComponent(text: string, style: ButtonStyle): ActionRowBuilder<ButtonBuilder> {
    const confirm = new ButtonBuilder()
        .setCustomId('confirm')
        .setLabel(text)
        .setStyle(style);
    const cancel = new ButtonBuilder()
        .setCustomId('cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary);
    return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(confirm, cancel);
}

/**
 * Handles an interaction to create an embed navigator.
 * @param interaction - The command interaction.
 * @param embeds - List of EmbedBuilder objects to navigate through.
 * @param files - List of AttachmentBuilder objects to attach to the message.
 * @param time - Time in milliseconds before the navigator expires.
 * @param ephemeral Whether to show the message or not
 */
async function handleEmbedNavigator(interaction: CommandInteraction<CacheType>, embeds: EmbedBuilder[], files: Map<number, AttachmentBuilder[]>, time: number, ephemeral: boolean = false): Promise<void> {
    if (embeds.length === 0) return; // If there are no embeds, do nothing.

    let currentIndex = 0; // Track the current embed index.

    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('previous')
                .setLabel('Previous')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true), // Disable if there's no previous embed.
            new ButtonBuilder()
                .setCustomId('next')
                .setLabel('Next')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(embeds.length <= 1) // Disable if there's no next embed.
        );

    const updateButtons = (index: number): void => {
        if (!row.components[0] || !row.components[1]) throw new Error('Error creating navigation buttons.');
        row.components[0].setDisabled(index === 0);
        row.components[1].setDisabled(index === embeds.length - 1);
    };

    const embedMessage = await interaction.reply({
        embeds: [embeds[currentIndex] || new EmbedBuilder().setDescription('No embeds to display.')],
        components: [row],
        files: files.get(currentIndex) ? files.get(currentIndex) : [],
        fetchReply: true,
        ephemeral
    }) as Message;

    const collector = embedMessage.createMessageComponentCollector({ time: time }); // Adjust time as needed.

    collector.on('collect', async buttonInteraction => {
        if (buttonInteraction.user.id !== interaction.user.id) {
            await buttonInteraction.reply({ content: "You cannot control this navigation.", ephemeral: true });
            return;
        }

        switch (buttonInteraction.customId) {
            case 'previous':
                if (currentIndex > 0) currentIndex--;
                break;
            case 'next':
                if (currentIndex < embeds.length - 1) currentIndex++;
                break;
        }

        updateButtons(currentIndex);
        await buttonInteraction.update({
            embeds: [embeds[currentIndex] || new EmbedBuilder().setDescription('No embeds to display.')],
            components: [row],
            files: files.get(currentIndex) ? files.get(currentIndex) : [],
        });
    });
}

function weightedRandom<E>(items: E[], weights: number[]) {
    if (items.length !== weights.length) throw new Error('Items and weights must have the same length.');
    if (items.length < 2) throw new Error('Items and weights must have more than 2 elements.');

    for (let i = 1; i < weights.length; i++)
        weights[i]! += weights[i - 1]!;

    let random = Math.random() * weights[weights.length - 1]!;

    let i;
    for (i = 0; i < weights.length; i++)
        if (weights[i]! > random)
            break;

    return items[i]!;
}


export {
    dollarize,
    logToChannel,
    chooseRandomStocks,
    stockPriceRandomWalk,
    getDateStringETC,
    getETCComponents,
    getETCComponentsPreviousDay,
    diffBlock,
    getStockLogo,
    timestampToETCComponents,
    getNextMidnightTimestampET,
    PADDING,
    SHORT_PADDING,
    EMBED_PADDING,
    getTimeStringEST,
    formatDate,
    confirmedEmbed,
    confirmComponent,
    handleEmbedNavigator,
    weightedRandom,
    getItemImage
};