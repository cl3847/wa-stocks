import Transaction from "./Transaction";

interface StockTransaction extends Transaction {
    ticker: string;
    quantity: number;
    price: number;
    total_price: number;
    balance_change: number;
    credit_change: number;
}

export default StockTransaction;