interface User {
    uid: string;
    balance: number;
}

interface Stock {
    ticker: string;
    price: number;
    multiplier: number;
    name: string;
    stock_ticker: string;
    stock_price: number;
    last_price_update: number;
}

interface UserStock {
    uid: string;
    ticker: string;
    quantity: number;
}