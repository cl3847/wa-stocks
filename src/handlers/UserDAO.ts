import UserPortfolio from "../models/user/UserPortfolio";
import User from "../models/user/User"
import UserStock from "../models/user_stock/UserStock";
import HeldStock from "../models/stock/HeldStock";
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
        const query = `SELECT u.*, us.*, s.* FROM users u
                       LEFT JOIN users_stocks us ON u.uid = us.uid
                       LEFT JOIN stocks s ON us.ticker = s.ticker
                       WHERE u.uid = $1`;
        const params = [uid];
        const result = await pc.query(query, params);
        if (result.rows.length === 0) return null;
        const portfolio = result.rows.map(row => row as HeldStock);
        return new UserPortfolio(result.rows[0] as User, portfolio);
    }

    public async createStockHolding(pc: PoolClient, holding: UserStock): Promise<void> {
        const keyString = Object.keys(holding).join(", ");
        const valueString = Object.keys(holding).map((_, index) => `$${index + 1}`).join(", ");
        const query = `INSERT INTO users_stocks (${keyString}) VALUES (${valueString})`;
        const params = Object.values(holding);
        await pc.query(query, params);
    }

    public async getStockHolding(pc: PoolClient, uid: string, ticker: string): Promise<UserStock | null> {
        const query = "SELECT * FROM users_stocks WHERE uid = $1 AND ticker = $2";
        const params = [uid, ticker];
        const result = await pc.query(query, params);
        return result.rows[0] || null;
    }

    public async updateStockHolding(pc: PoolClient, uid: string, ticker: string, holding: Partial<UserStock>): Promise<void> {
        if (Object.keys(holding).length === 0) {
            throw new Error("No fields to update");
        }
        const fields = Object.keys(holding).map((key, index) => `${key} = $${index + 1}`).join(', ');
        const query = `UPDATE users_stocks SET ${fields} WHERE uid = $${Object.keys(holding).length + 1} AND ticker = $${Object.keys(holding).length + 2}`;
        const params = [...Object.values(holding), uid, ticker];
        await pc.query(query, params);
    }
}

export default UserDAO;
