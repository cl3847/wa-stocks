import {PoolClient} from "pg";
import log from "./logger";

const initDb = async (pc: PoolClient) => {
    const createTable = async (tableName: string, createSql: string) => {
        const checkQuery = `SELECT EXISTS (
            SELECT FROM pg_tables 
            WHERE  schemaname = 'public' 
            AND    tablename  = $1
        );`;
        const existsResult = await pc.query(checkQuery, [tableName]);
        if (!existsResult.rows[0].exists) {
            log.info(`Table '${tableName}' not found. Creating...`);
            await pc.query(createSql);
            log.success(`Table created: ${tableName}.`);
        }
    };

    // Execute checks and creation
    await createTable('users', `
        CREATE TABLE users (
            uid TEXT PRIMARY KEY,
            balance INT NOT NULL DEFAULT 0,
            loan_balance INT NOT NULL DEFAULT 0,
            credit_limit INT NOT NULL DEFAULT 0
        );`
    );
    await createTable('stocks', `
        CREATE TABLE stocks (
            ticker TEXT PRIMARY KEY,
            price BIGINT NOT NULL,
            multiplier FLOAT DEFAULT 1,
            name TEXT NOT NULL,
            stock_ticker TEXT NOT NULL,
            stock_price BIGINT NOT NULL,
            last_update_timestamp BIGINT DEFAULT 0
        );`
    );
    await createTable('users_stocks', `
        CREATE TABLE users_stocks (
            uid TEXT NOT NULL,
            ticker TEXT NOT NULL,
            quantity INT NOT NULL DEFAULT 0,
            timestamp BIGINT NOT NULL,
            PRIMARY KEY (uid, ticker, timestamp),
            FOREIGN KEY(uid) REFERENCES users(uid) ON UPDATE CASCADE ON DELETE CASCADE,
            FOREIGN KEY(ticker) REFERENCES stocks(ticker) ON UPDATE CASCADE ON DELETE CASCADE
        );`
    );
    await createTable('transactions', `
        CREATE TABLE transactions (
            tid SERIAL PRIMARY KEY,
            type TEXT NOT NULL,
            uid TEXT NOT NULL,
            timestamp BIGINT NOT NULL,
            ticker TEXT,
            quantity INT,
            price BIGINT,
            total_price BIGINT,
            balance_change BIGINT,
            credit_change BIGINT,
            destination TEXT,
            is_destination_user BOOLEAN,
            memo TEXT,
            FOREIGN KEY(uid) REFERENCES users(uid) ON UPDATE CASCADE ON DELETE CASCADE,
            FOREIGN KEY(ticker) REFERENCES stocks(ticker) ON UPDATE CASCADE ON DELETE CASCADE
        );`
    );
    await createTable('prices', `
        CREATE TABLE prices (
            ticker TEXT NOT NULL, 
            close_price BIGINT NOT NULL,
            open_price BIGINT NOT NULL,
            high_price BIGINT NOT NULL,
            low_price BIGINT NOT NULL,
            year INT NOT NULL,
            month INT NOT NULL,
            date INT NOT NULL,
            PRIMARY KEY (ticker, year, month, date),
            FOREIGN KEY(ticker) REFERENCES stocks(ticker) ON UPDATE CASCADE ON DELETE CASCADE
        );`
    );
    await createTable('objects', `
        CREATE TABLE objects (
            name TEXT PRIMARY KEY,
            data JSONB DEFAULT '{}'
        );`
    );
    await createTable('news', `
        CREATE TABLE news (
            news_id SERIAL PRIMARY KEY,
            message_link TEXT NOT NULL,
            body TEXT NOT NULL,
            timestamp BIGINT NOT NULL
        );`
    );
    await createTable('stocks_news', `
        CREATE TABLE stocks_news (
            ticker TEXT NOT NULL,
            news_id INT NOT NULL,
            PRIMARY KEY (ticker, news_id),
            FOREIGN KEY (ticker) REFERENCES stocks(ticker) ON UPDATE CASCADE ON DELETE CASCADE,
            FOREIGN KEY (news_id) REFERENCES news(news_id) ON UPDATE CASCADE ON DELETE CASCADE
        );`
    );
    await createTable('items', `
        CREATE TABLE items (
            item_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            tradable BOOLEAN NOT NULL DEFAULT FALSE,
            type TEXT NOT NULL,
            rarity TEXT
        );`
    );
    await createTable('users_items', `
        CREATE TABLE users_items (
            uid TEXT NOT NULL,
            item_id TEXT NOT NULL,
            quantity INT NOT NULL DEFAULT 0,
            PRIMARY KEY (uid, item_id),
            FOREIGN KEY(uid) REFERENCES users(uid) ON UPDATE CASCADE ON DELETE CASCADE,
            FOREIGN KEY(item_id) REFERENCES items(item_id) ON UPDATE CASCADE ON DELETE CASCADE
        );`
    );
    await createTable('requests', `
            CREATE TABLE requests (
            level_id TEXT PRIMARY KEY,
            bounty INT NOT NULL
        );`
    );
    // check if gameState exists in objects
    if (!await pc.query(`SELECT * FROM objects WHERE name = 'gameState';`)) {
        await pc.query(`INSERT INTO objects (name, data) VALUES ('gameState', '{"isMarketOpen": false, "marketState": "closed"}');`);
    }
};

export {initDb}
