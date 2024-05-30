import DAOs from "../models/DAOs";
import UserStock from "../models/user_stock/UserStock";
import {Pool} from "pg";
import UserNotFoundError from "../models/error/UserNotFoundError";
import StockNotFoundError from "../models/error/StockNotFoundError";
import InsufficientBalanceError from "../models/error/InsufficientBalanceError";

class TransactionService {
    private daos: DAOs;
    private pool: Pool;

    constructor(daos: DAOs, pool: Pool) {
        this.daos = daos;
        this.pool = pool;
    }

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
            if (holding) {
                await this.daos.users.updateStockHolding(client, uid, ticker, {quantity: newQuantity});
            } else {
                const newHolding: UserStock = {
                    uid: uid,
                    ticker: ticker,
                    quantity: newQuantity,
                }
                await this.daos.users.createStockHolding(client, newHolding);
            }
            await this.daos.users.updateUser(client, uid, {balance: newBalance});
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
