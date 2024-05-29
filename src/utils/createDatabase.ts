import {Pool} from "pg";

const initDb = async (pool: Pool) => {
    const pc = await pool.connect();

    const createTable = async (tableName: string, createSql: string) => {
        const checkQuery = `SELECT EXISTS (
            SELECT FROM pg_tables 
            WHERE  schemaname = 'public' 
            AND    tablename  = $1
        );`;
        const existsResult = await pc.query(checkQuery, [tableName]);
        if (!existsResult.rows[0].exists) {
            await pc.query(createSql);
            console.log(`Table created: ${tableName}`);
        }
    };

    // Execute checks and creation
    await createTable('users', `
        CREATE TABLE users (
            uid TEXT PRIMARY KEY,
            balance INT NOT NULL DEFAULT 0
        );`
    );
    await createTable('stocks', `
        CREATE TABLE stocks (
            ticker TEXT PRIMARY KEY,
            price INT NOT NULL,
            multiplier INT DEFAULT 1,
            name TEXT NOT NULL,
            stock_ticker TEXT NOT NULL,
            stock_price INT NOT NULL,
            last_price_update INT DEFAULT 0
        );`
    );
    await createTable('users_stocks', `
        CREATE TABLE users_stocks (
            uid TEXT NOT NULL,
            ticker TEXT NOT NULL,
            quantity INT NOT NULL DEFAULT 0,
            PRIMARY KEY (uid, ticker),
            FOREIGN KEY(uid) REFERENCES users(uid) ON UPDATE CASCADE ON DELETE CASCADE,
            FOREIGN KEY(ticker) REFERENCES stocks(ticker) ON UPDATE CASCADE ON DELETE CASCADE
        );`
    );

    pc.release();
};

export {initDb}
