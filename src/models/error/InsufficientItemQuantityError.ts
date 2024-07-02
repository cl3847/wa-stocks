class InsufficientItemQuantityError extends Error {
    uid: string;
    itemQuantity: number;
    amount: number;

    constructor(uid: string, itemQuantity: number, amount: number) {
        super(`User with UID '${uid}' has insufficient item quantity of ${itemQuantity} for an operation requiring: ${amount}`);
        this.uid = uid;
        this.itemQuantity = itemQuantity;
        this.amount = amount;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InsufficientItemQuantityError);
        }
        Object.setPrototypeOf(this, InsufficientItemQuantityError.prototype);
        this.name = this.constructor.name;
    }
}

export default InsufficientItemQuantityError;