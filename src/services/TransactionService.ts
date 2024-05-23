import {DAOs} from "../models/types";

class TransactionService {
    daos: DAOs;

    constructor(daos: DAOs) {
        this.daos = daos;
    }

    public buyStock(uid: string, ticker: string, add: number): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                const holding = await this.daos.users.getStockHolding(uid, ticker);
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
            }
        });
    }
}

export default TransactionService;