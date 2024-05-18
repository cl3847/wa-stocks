interface User {
    uid: string,
    balance: number
}

interface Stock {
    ticker: string,
    stock_ticker: string,
    multiplier: number,
    stock_price: number
}

interface User_Stock {
    uid: string,
    ticker: string,
    quantity: number
}