class InsufficientStockQuantityError extends Error {
    uid: string;
    stockQuantity: number;
    amount: number;

    constructor(uid:string, stockQuantity: number, amount: number) {
        super(`User with UID '${uid}' has insufficient stock quantity of ${stockQuantity} for an operation requiring: ${amount}`);
        this.uid = uid;
        this.stockQuantity = stockQuantity;
        this.amount = amount;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InsufficientStockQuantityError);
        }
        Object.setPrototypeOf(this, InsufficientStockQuantityError.prototype);
        this.name = this.constructor.name;
    }
}

export default InsufficientStockQuantityError;