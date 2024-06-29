import User from "../user/User";
import Wireable from "../wire/Wireable";

class WireRejectionError extends Error {
    user: User;
    destination: Wireable;

    constructor(user: User, destination: Wireable, message: string) {
        super(message);
        this.user = user;
        this.destination = destination;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, WireRejectionError);
        }
        Object.setPrototypeOf(this, WireRejectionError.prototype);
        this.name = this.constructor.name;
    }
}

export default WireRejectionError;