interface Transaction {
    tid?: number;
    type: string;
    uid: string;
    ticker: string;
    quantity: number;
    price: number;
    total_price: number;
    timestamp: number;
}

export default Transaction;