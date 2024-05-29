import DAOs from "../models/DAOs";
import UserStock from "../models/user_stock/UserStock";
import {Pool} from "pg";

class TransactionService {
    private daos: DAOs;
    private pool: Pool;

    constructor(daos: DAOs, pool: Pool) {
        this.daos = daos;
        this.pool = pool;
    }

    public buyStock(uid: string, ticker: string, add: number): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const pc = await this.pool.connect();
            try {
                // TODO make sure user has enough balance and subtract it
                const user = await this.daos.users.getUserPortfolio(pc, uid);
                const stock = await this.daos.stocks.getStock(pc, ticker);
                if (!user) {
                    reject("User does not exist");
                    return;
                } else if (!stock) {
                    reject("Stock does not exist");
                    return;
                } else if (user.balance < stock.price * add) {
                    reject("User balance is insufficient");
                    return;
                }

                const holding = user.portfolio.find(hs => hs.ticker === ticker);
                const newQuantity = holding ? holding.quantity + add : add;

                if (holding) { // update quantity on existing row
                    await this.daos.users.updateStockHolding(pc, uid, ticker, {quantity: newQuantity});
                    resolve();
                } else { // create new row
                    const newHolding: UserStock = {
                        uid: uid,
                        ticker: ticker,
                        quantity: newQuantity,
                    }
                    await this.daos.users.createStockHolding(pc, newHolding);
                    resolve();
                }
            } catch(err) {
                reject(err);
            } finally {
                pc.release();
            }
        });
    }
}

export default TransactionService;