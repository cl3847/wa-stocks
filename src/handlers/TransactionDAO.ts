import {PoolClient} from "pg";
import Transaction from "../models/transaction/Transaction";

class TransactionDAO {
    public async createTransaction(pc: PoolClient, transaction: Transaction): Promise<void> {
        const keyString = Object.keys(transaction).join(", ");
        const valueString = Object.keys(transaction).map((_, index) => `$${index + 1}`).join(", ");
        const query = `INSERT INTO transactions (${keyString}) VALUES (${valueString})`;
        const params = Object.values(transaction);
        await pc.query(query, params);
    }
}

export default TransactionDAO;