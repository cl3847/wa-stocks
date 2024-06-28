class InsufficientBalanceError extends Error {
    uid: string;
    balance: number;
    cost: number;

    constructor(uid: string, balance: number, cost: number) {
        super(`User with UID '${uid}' has insufficient balance of ${balance} for an operation of cost: ${cost}`);
        this.uid = uid;
        this.balance = balance;
        this.cost = cost;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InsufficientBalanceError);
        }
        Object.setPrototypeOf(this, InsufficientBalanceError.prototype);
        this.name = this.constructor.name;
    }
}

export default InsufficientBalanceError;