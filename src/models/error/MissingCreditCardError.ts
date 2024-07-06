class MissingCreditCardError extends Error {
    uid: string;

    constructor(uid: string) {
        super(`User with uid '${uid}' does not have a credit card.`);
        this.uid = uid;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, MissingCreditCardError);
        }
        Object.setPrototypeOf(this, MissingCreditCardError.prototype);
        this.name = this.constructor.name;
    }
}

export default MissingCreditCardError;