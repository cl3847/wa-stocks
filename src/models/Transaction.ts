interface Transaction {
    tid?: number;
    type: string;
    uid: string;
    ticker: string;
    balance_used: number | null;
    credit_used: number | null;
    quantity: number;
    price: number;
    total_price: number;
    timestamp: number;
}

export default Transaction;