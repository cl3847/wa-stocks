import DAOs from "../models/DAOs";
import UserStock from "../models/user_stock/UserStock";
import {Pool} from "pg";
import UserNotFoundError from "../models/error/UserNotFoundError";
import StockNotFoundError from "../models/error/StockNotFoundError";
import InsufficientBalanceError from "../models/error/InsufficientBalanceError";
import Transaction from "../models/Transaction";
import InsufficientStockQuantityError from "../models/error/InsufficientStockQuantityError";

class TransactionService {
    private daos: DAOs;
    private pool: Pool;

    constructor(daos: DAOs, pool: Pool) {
        this.daos = daos;
        this.pool = pool;
    }

    /**
     * Buys a stock for a user and updates their balance and stock holdings.
     * @param {string} uid The user ID
     * @param {string} ticker The stock ticker of the stock to buy
     * @param {number} add The quantity of the stock to buy
     * @returns {Promise<void>} A promise resolving to nothing
     */
    public async buyStock(uid: string, ticker: string, add: number): Promise<void> {
        const client = await this.pool.connect();

        const user = await this.daos.users.getUserPortfolio(client, uid);
        const stock = await this.daos.stocks.getStock(client, ticker);

        if (!user) {
            client.release();
            throw new UserNotFoundError(uid);
        } else if (!stock) {
            client.release();
            throw new StockNotFoundError(ticker);
        }

        const cost = stock.price * add;
        if (user.balance < cost) {
            client.release();
            throw new InsufficientBalanceError(uid, user.balance, cost);
        }

        const holding = user.portfolio.find(hs => hs.ticker === ticker);
        const newQuantity = holding ? holding.quantity + add : add;
        const newBalance = user.balance - cost;

        try {
            await client.query('BEGIN');

            // update or create stock holding
            if (holding) {
                await this.daos.users.updateStockHolding(client, uid, ticker, {quantity: newQuantity});
            } else {
                const newHolding: UserStock = {
                    uid: uid,
                    ticker: ticker,
                    quantity: newQuantity,
                };
                await this.daos.users.createStockHolding(client, newHolding);
            }
            await this.daos.users.updateUser(client, uid, {balance: newBalance});

            // save transaction record
            const transactionRecord: Transaction = {
                type: 'buy',
                uid: uid,
                ticker: ticker,
                quantity: add,
                price: stock.price,
                total_price: cost,
                timestamp: Date.now(),
            };
            await this.daos.transactions.createTransaction(client, transactionRecord);
            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err; // Re-throw to be handled by the caller
        } finally {
            client.release();
        }
    }

    public async sellStock(uid: string, ticker: string, remove: number): Promise<void> {
        const client = await this.pool.connect();

        const user = await this.daos.users.getUserPortfolio(client, uid);
        const stock = await this.daos.stocks.getStock(client, ticker);
        const holding = await this.daos.users.getStockHolding(client, uid, ticker);

        if (!user) {
            client.release();
            throw new UserNotFoundError(uid);
        } else if (!stock) {
            client.release();
            throw new StockNotFoundError(ticker);
        }

        if (!holding || remove > holding.quantity) {
            client.release();
            throw new InsufficientStockQuantityError(uid, holding?.quantity || 0, remove);
        }

        const newQuantity = holding.quantity - remove;
        const newBalance = user.balance + stock.price * remove;

        try {
            await client.query('BEGIN');
            await this.daos.users.updateStockHolding(client, uid, ticker, {quantity: newQuantity});
            await this.daos.users.updateUser(client, uid, {balance: newBalance});

            // save transaction record
            const transactionRecord: Transaction = {
                type: 'sell',
                uid: uid,
                ticker: ticker,
                quantity: remove,
                price: stock.price,
                total_price: stock.price * remove,
                timestamp: Date.now(),
            };
            await this.daos.transactions.createTransaction(client, transactionRecord);
            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err; // Re-throw to be handled by the caller
        } finally {
            client.release();
        }
    }
}

export default TransactionService;
