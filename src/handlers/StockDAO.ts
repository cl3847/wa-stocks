import * as sqlite3 from "sqlite3";
import Stock from "../models/stock/Stock";

class StockDAO {
    private db: sqlite3.Database;

    constructor(db: sqlite3.Database) {
        this.db = db;
    }

    /**
     * Writes a Stock object to the database
     * @param {Stock} stock The stock for which to write to the database
     * @returns {Promise<void>} A promise resolving to nothing
     */
    public async createStock(stock: Stock): Promise<void> {
        return new Promise((resolve, reject) => {
            const keyString = Object.keys(stock).join(", ");
            const placeholderString = Object.keys(stock).fill('?').join(", ");
            const query = `INSERT INTO stocks (${keyString}) VALUES (${placeholderString})`;
            const params = Object.values(stock);
            this.db.run(query, params, (err) => {
                if (err) reject(err);
                else resolve();
            })
        })
    }

    /**
     * Gets a stock corresponding to a specific ticker
     * @param {string} ticker The ticker of the stock for which to get
     * @returns {Promise<Stock | null>} A promise resolving to a Stock if a stock with the ticker exists, otherwise null
     */
    public async getStock(ticker: string): Promise<Stock | null> {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM stocks WHERE ticker = $ticker";
            const params = {$ticker: ticker};
            this.db.get(query, params, (err, row: Stock) => {
                if (err) reject(err);
                else resolve(row || null);
            });
        });
    }

    /**
     * Updates a stock corresponding to a specific ticker
     * @param {string} ticker The ticker of the stock for which to update
     * @param {Partial<Stock>} stock The fields to update in the stock
     * @returns {Promise<void>} A promise resolving to nothing
     */
    public async updateStock(ticker: string, stock: Partial<Stock>): Promise<void> {
        return new Promise((resolve, reject) => {
            if (Object.keys(stock).length === 0) return reject(new Error("No fields to update"));
            const query = `UPDATE stocks SET ${Object.keys(stock).map(key => `${key} = ?`).join(', ')} WHERE ticker = ?`;
            const params = [...Object.values(stock), ticker];
            this.db.run(query, params, (err) => {
                if (err) reject(err);
                else resolve();
            })
        })
    }

    /**
     * Deletes a stock corresponding to a specific ticker
     * @param {string} ticker The ticker of the stock for which to delete
     * @returns {Promise<void>} A promise resolving to nothing
     */
    public async deleteStock(ticker: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const query = "DELETE FROM stocks WHERE ticker = $ticker";
            const params = {$ticker: ticker};
            this.db.run(query, params, (err) => {
                if (err) reject(err);
                else resolve();
            })
        })
    }

    /**
     * Gets a list of all stocks in the database
     * @returns {Promise<Stock[] | null>} A promise resolving to a list of all stocks
     */
    public async getAllStocks(): Promise<Stock[] | null> {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM stocks";
            this.db.all(query, (err, rows: Stock[]) => {
                if (err) reject(err);
                else resolve(rows || null);
            });
        });
    }
}

export default StockDAO;
