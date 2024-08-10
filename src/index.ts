import {Pool, types} from "pg";
import UserDAO from "./handlers/UserDAO";
import StockDAO from "./handlers/StockDAO";
import DAOs from "./models/DAOs";
import {initDb} from "./utils/createDatabase";
import log from "./utils/logger";
import config from "../config";
import Service from "./services/Service";
import {Client, Collection, Events, GatewayIntentBits, Options, REST, Routes} from "discord.js"
import * as fs from 'node:fs';
import * as path from 'node:path';
import CommandType from "./types/CommandType";
import TransactionDAO from "./handlers/TransactionDAO";
import ObjectDAO from "./handlers/ObjectDAO";
import {initJobs} from "./utils/jobs";
import ItemDAO from "./handlers/ItemDAO";
import RequestDAO from "./handlers/RequestDAO";
import {updatePriceBoard} from "./utils/priceBoard";

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
        requests: new RequestDAO()
    };
    await Service.init(daos, pool);

    // initialize Discord client
    const client = new Client({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildPresences],
        makeCache: Options.cacheWithLimits({
            MessageManager: 0
        }),
    });

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

        // autocomplete
        if (interaction.isAutocomplete()) {
            const autocompleteCommand = commands.get(interaction.commandName)!;
            try {
                await autocompleteCommand.autocomplete!(interaction);
            }
            catch(e) { log.error(e) }
            return;
        }

        else if (!interaction.isChatInputCommand()) return;

        // slash commands
        const command = commands.get(interaction.commandName);
        if (!command) {
            log.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
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
                    await interaction.reply({
                        content: 'There was an error while executing this command!',
                        ephemeral: true
                    });
                }
            }
        } catch (err) {
            log.error(err.stack);
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
        // (client.channels.cache.get("1263909750278586511") as TextChannel).send("Placeholder2")
        // await Service.getInstance().stocks.synchronizeAllStockPrices();
        // await Service.getInstance().stocks.synchronizeStockPrice("VNVDA");

        //console.log("assigning cards");
        //await assignCreditCards();
        //console.log("done assigning cards");
        //console.log("assigning roles");
        //await updateRoles(client);
        //console.log("done assigning roles");

        //await assignRewards();
        //console.log("done assigning rewards");

        await updatePriceBoard(client);
        initJobs(client);
    } catch (err) {
        log.error(err.stack);
    }
})();

