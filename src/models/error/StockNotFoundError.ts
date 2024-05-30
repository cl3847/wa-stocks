class StockNotFoundError extends Error {
    ticker: string;

    constructor(ticker: string) {
        super(`Stock with ticker '${ticker}' not found.`);
        this.ticker = ticker;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, StockNotFoundError);
        }
        Object.setPrototypeOf(this, StockNotFoundError.prototype);
        this.name = this.constructor.name;
    }
}

export default StockNotFoundError;