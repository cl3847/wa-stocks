import {Pool, types} from "pg";
import UserDAO from "./handlers/UserDAO";
import StockDAO from "./handlers/StockDAO";
import DAOs from "./models/DAOs";
import {initDb} from "./utils/createDatabase";
import log from "./utils/logger";
import config from "../config";
import Service from "./services/Service";
import {Client, Collection, Events, GatewayIntentBits, REST, Routes} from "discord.js"
import * as fs from 'node:fs';
import * as path from 'node:path';
import CommandType from "./types/CommandType";
import TransactionDAO from "./handlers/TransactionDAO";
import ObjectDAO from "./handlers/ObjectDAO";
import {initJobs} from "./utils/jobs";
import {updatePriceBoard} from "./utils/priceBoard";
import ItemDAO from "./handlers/ItemDAO";

require('dotenv').config();

(async () => {
    if (!process.env.DATABASE_URL || !process.env.DISCORD_TOKEN) {
        log.error("Missing environment variables, exiting.");
        process.exit(1);
    }
    // create database connection pool
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        ssl: {
            rejectUnauthorized: false
        }
    });

    types.setTypeParser(20, (val) => parseInt(val, 10)); // parse int8 as number

    // test connection to database, and initialize tables if not created
    try {
        const pc = await pool.connect();
        log.success("Connected to Postgres database.");
        await initDb(pc);
        pc.release();
    } catch (err) {
        log.error(err.message);
        process.exit(1);
    }

    // initialize DAOs and Services
    const daos: DAOs = {
        users: new UserDAO(),
        stocks: new StockDAO(),
        transactions: new TransactionDAO(),
        objects: new ObjectDAO(),
        items: new ItemDAO(),
    };
    await Service.init(daos, pool);

    // initialize Discord client
    const client = new Client({intents: [GatewayIntentBits.Guilds]});

    client.once(Events.ClientReady, readyClient => {
        log.success(`Logged into Discord as ${readyClient.user.tag}.`);
    });

    try {
        await client.login(process.env.DISCORD_TOKEN);
    } catch (err) {
        log.error(err.message);
        process.exit(1);
    }

    const commands: Collection<string, CommandType> = new Collection();
    const commandData = [];
    const foldersPath = path.join(__dirname, 'commands');
    const commandFolders = fs.readdirSync(foldersPath);
    for (const folder of commandFolders) {
        const commandFiles = fs.readdirSync(`${foldersPath}/${folder}`).filter(file => file.endsWith('.ts'));
        for (const file of commandFiles) {
            const command: CommandType = require(`./commands/${folder}/${file}`);
            commandData.push(command.data);
            commands.set(command.data.name, command);
        }
    }

    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isChatInputCommand()) return;
        const command = commands.get(interaction.commandName);
        if (!command) {
            log.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            log.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: 'There was an error while executing this command!',
                    ephemeral: true
                });
            } else {
                await interaction.reply({content: 'There was an error while executing this command!', ephemeral: true});
            }
        }
    });

    const rest = new REST().setToken(process.env.DISCORD_TOKEN);

    try {
        log.info(`Started refreshing ${commandData.length} application (/) commands.`);
        const data: any = await rest.put(
            Routes.applicationGuildCommands(config.bot.clientID, config.bot.guildID),
            {body: commandData},
        );

        log.success(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        log.error(error);
    }

    // initialize cron jobs

    try {
        await updatePriceBoard(client);
        initJobs(client);
    } catch (err) {
        log.error(err.stack);
    }
})();

