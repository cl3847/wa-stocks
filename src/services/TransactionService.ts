import DAOs from "../models/DAOs";
import UserStock from "../models/user_stock/UserStock";

class TransactionService {
    daos: DAOs;

    constructor(daos: DAOs) {
        this.daos = daos;
    }

    public buyStock(uid: string, ticker: string, add: number): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                // TODO make sure user has enough balance and subtract it
                const user = await this.daos.users.getUserPortfolio(uid);
                if (!user) {
                    reject("User does not exist");
                    return;
                }
                const holding = user.portfolio.find(hs => hs.ticker === ticker);
                const newQuantity = holding ? holding.quantity + add : add;

                if (holding) { // update quantity on existing row
                    holding.quantity = newQuantity;
                    await this.daos.users.updateStockHolding(uid, ticker, holding);
                    resolve();
                } else { // create new row
                    const newHolding: UserStock = {
                        uid: uid,
                        ticker: ticker,
                        quantity: newQuantity,
                    }
                    await this.daos.users.createStockHolding(newHolding);
                    resolve();
                }
            } catch(err) {
                reject(err);
                return;
            }
        });
    }
}

export default TransactionService;