class InsufficentNetWorthError extends Error {
    uid: string;
    netWorth: number;
    cost: number;

    constructor(uid: string, netWorth: number, cost: number) {
        super(`User with UID '${uid}' has insufficient net worth of ${netWorth} for an operation of cost: ${cost}`);
        this.uid = uid;
        this.netWorth = netWorth;
        this.cost = cost;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InsufficentNetWorthError);
        }
        Object.setPrototypeOf(this, InsufficentNetWorthError.prototype);
        this.name = this.constructor.name;
    }
}

export default InsufficentNetWorthError;