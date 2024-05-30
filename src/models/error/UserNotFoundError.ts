class UserNotFoundError extends Error {
    uid: string;

    constructor(uid: string) {
        super(`User with ID '${uid}' not found.`);
        this.uid = uid;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, UserNotFoundError);
        }
        Object.setPrototypeOf(this, UserNotFoundError.prototype);
        this.name = this.constructor.name;
    }
}

export default UserNotFoundError;