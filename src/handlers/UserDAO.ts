import UserPortfolio from "../models/user/UserPortfolio";
import User from "../models/user/User"
import UserStock from "../models/user/UserStock";
import {PoolClient} from "pg";

class UserDAO {
    /**
     * Writes a User object to the database
     * @param pc {PoolClient} A Postgres Client
     * @param {User} user The user for which to write to the database
     * @returns {Promise<void>} A promise resolving to nothing
     */
    public async createUser(pc: PoolClient, user: User): Promise<void> {
        const keyString = Object.keys(user).join(", ");
        const valueString = Object.keys(user).map((_, index) => `$${index + 1}`).join(", ");
        const query = `INSERT INTO users (${keyString}) VALUES (${valueString})`;
        const params = Object.values(user);
        await pc.query(query, params);
    }

    /**
     * Gets a user corresponding to a specific UID
     * @param pc {PoolClient} A Postgres Client
     * @param {string} uid The UID of the user for which to get
     * @returns {Promise<User | null>} A promise resolving to a User if a user with the UID exists, otherwise null
     */
    public async getUser(pc: PoolClient, uid: string): Promise<User | null> {
        const query = "SELECT * FROM users WHERE uid = $1";
        const params = [uid];
        const result = await pc.query(query, params);
        return result.rows[0] || null;
    }

    /**
     * Updates a user corresponding to a specific UID
     * @param pc {PoolClient} A Postgres Client
     * @param {string} uid The UID of the user for which to update
     * @param {Partial<User>} user The fields to update in the user
     * @returns {Promise<void>} A promise resolving to nothing
     */
    public async updateUser(pc: PoolClient, uid: string, user: Partial<User>): Promise<void> {
        const fields = Object.keys(user).map((key, index) => `${key} = $${index + 1}`).join(", ");
        const query = `UPDATE users SET ${fields} WHERE uid = $${Object.keys(user).length + 1}`;
        const params = [...Object.values(user), uid];
        await pc.query(query, params);
    }


    /**
     * Deletes a user corresponding to a specific UID
     * @param pc {PoolClient} A Postgres Client
     * @param {string} uid The UID of the user for which to delete
     * @returns {Promise<void>} A promise resolving to nothing
     */
    public async deleteUser(pc: PoolClient, uid: string): Promise<void> {
        const query = "DELETE FROM users WHERE uid = $1";
        const params = [uid];
        await pc.query(query, params);
    }

    /**
     * Gets a user with portfolio information corresponding to a specific UID
     * @param pc {PoolClient} A Postgres Client
     * @param {string} uid The UID of the user for which to get
     * @returns {Promise<UserPortfolio | null>} A promise resolving to a UserPortfolio if a user with the UID exists, otherwise null
     */
    public async getUserPortfolio(pc: PoolClient, uid: string): Promise<UserPortfolio | null> {
        return this.getUserPortfolioTimestamp(pc, uid, Date.now());
    }

    public async getAllUserPortfolios(pc: PoolClient): Promise<UserPortfolio[]> {
        const query = `
            SELECT row_to_json(u.*) as profile,
                json_agg(DISTINCT to_jsonb(us_s.*)) AS portfolio,
                json_agg(DISTINCT to_jsonb(ui_i.*)) AS inventory
            FROM users u
            LEFT JOIN (
                SELECT us_temp.*, s.*
                FROM users_stocks us_temp
                JOIN stocks s ON us_temp.ticker = s.ticker
                INNER JOIN (
                    SELECT uid, ticker, MAX(timestamp) AS max_timestamp
                    FROM users_stocks
                    GROUP BY uid, ticker
                ) max_us ON us_temp.uid = max_us.uid AND us_temp.ticker = max_us.ticker AND us_temp.timestamp = max_us.max_timestamp
                WHERE us_temp.quantity > 0
                ORDER BY us_temp.quantity * s.price DESC
            ) as us_s ON u.uid = us_s.uid
            LEFT JOIN (
                SELECT ui.*, i.* FROM users_items ui
                INNER JOIN items i ON ui.item_id = i.item_id
                WHERE ui.quantity > 0
                ORDER BY i.item_id
            ) ui_i ON ui_i.uid = u.uid
            GROUP BY u.uid, u.balance, u.loan_balance
            ORDER BY u.balance - u.loan_balance + COALESCE(SUM(us_s.price * us_s.quantity), 0) DESC NULLS LAST
        `;
        const result = await pc.query(query);
        const portfolios: UserPortfolio[] = [];
        for (const row of result.rows) {
            portfolios.push(new UserPortfolio(row.profile as User, row.portfolio[0] ? row.portfolio : [], row.inventory[0] ? row.inventory : []));
        }
        return portfolios;
    }

    public async createStockHolding(pc: PoolClient, holding: UserStock): Promise<void> {
        const keyString = Object.keys(holding).join(", ");
        const valueString = Object.keys(holding).map((_, index) => `$${index + 1}`).join(", ");
        const query = `INSERT INTO users_stocks (${keyString}) VALUES (${valueString})`;
        const params = Object.values(holding);
        await pc.query(query, params);
    }

    public async getMostRecentStockHolding(pc: PoolClient, uid: string, ticker: string): Promise<UserStock | null> {
        const query = "SELECT * FROM users_stocks WHERE uid = $1 AND ticker = $2 ORDER BY timestamp DESC LIMIT 1";
        const params = [uid, ticker];
        const result = await pc.query(query, params);
        return result.rows[0] || null;
    }

    public async getUserPortfolioTimestamp(pc: PoolClient, uid: string, timestamp: number): Promise<UserPortfolio | null> {
        const query = `
            SELECT row_to_json(u.*) as profile, 
                json_agg(DISTINCT to_jsonb(us_s.*)) AS portfolio,
                json_agg(DISTINCT to_jsonb(ui_i.*)) AS inventory
            FROM users u
            LEFT JOIN (
                SELECT us_temp.*, s.*
                FROM users_stocks us_temp
                JOIN stocks s ON us_temp.ticker = s.ticker
                INNER JOIN (
                    SELECT uid, ticker, MAX(timestamp) AS max_timestamp
                    FROM users_stocks
                    WHERE timestamp <= $2
                    GROUP BY uid, ticker
                ) max_us ON us_temp.uid = max_us.uid AND us_temp.ticker = max_us.ticker AND us_temp.timestamp = max_us.max_timestamp
                WHERE us_temp.quantity > 0
                ORDER BY us_temp.quantity * s.price DESC
            ) as us_s ON u.uid = us_s.uid
            
            LEFT JOIN (
                SELECT ui.*, i.* FROM users_items ui
                INNER JOIN items i ON ui.item_id = i.item_id
                WHERE ui.quantity > 0
                ORDER BY i.item_id
            ) ui_i ON ui_i.uid = u.uid
            WHERE u.uid = $1 
            GROUP BY u.uid;
        `;
        const params = [uid, timestamp];
        const result = await pc.query(query, params);
        if (result.rows.length === 0) return null;
        return new UserPortfolio(result.rows[0].profile as User, result.rows[0].portfolio[0] ? result.rows[0].portfolio : [], result.rows[0].inventory[0] ? result.rows[0].inventory : []);
    }

    public async getUserStockHistoryAfterTimestamp(pc: PoolClient, uid: string, timestamp: number): Promise<UserStock[]> {
        const query = "SELECT * FROM users_stocks WHERE uid = $1 AND timestamp > $2 ORDER BY timestamp DESC";
        const params = [uid, timestamp];
        const result = await pc.query(query, params);
        return result.rows.map(row => row as UserStock);
    }

    public async createItemHolding(pc: PoolClient, holding: UserItem): Promise<void> {
        const keyString = Object.keys(holding).join(", ");
        const valueString = Object.keys(holding).map((_, index) => `$${index + 1}`).join(", ");
        const query = `INSERT INTO users_items (${keyString}) VALUES (${valueString})`;
        const params = Object.values(holding);
        await pc.query(query, params);
    }

    public async updateItemHolding(pc: PoolClient, userId: string, itemId: string, holding: Partial<UserItem>): Promise<void> {
        if (Object.keys(holding).length === 0) {
            throw new Error("No fields to update");
        }
        const fields = Object.keys(holding).map((key, index) => `${key} = $${index + 1}`).join(', ');
        const query = `UPDATE users_items SET ${fields} WHERE uid = $${Object.keys(holding).length + 1} AND item_id = $${Object.keys(holding).length + 2}`;
        const params = [...Object.values(holding), userId, itemId];
        await pc.query(query, params);
    }

    public async getItemHolding(pc: PoolClient, uid: string, itemId: string): Promise<UserItem | null> {
        const query = "SELECT * FROM users_items WHERE uid = $1 AND item_id = $2";
        const params = [uid, itemId];
        const result = await pc.query(query, params);
        return result.rows[0] || null;
    }
}

export default UserDAO;
