interface User {
    uid: string,
    balance: number
}

interface Stock {
    ticker: string,
    name: string,
    stock_ticker: string,
    multiplier: number,
    stock_price: number
}

interface UserStock {
    uid: string,
    ticker: string,
    quantity: number
}