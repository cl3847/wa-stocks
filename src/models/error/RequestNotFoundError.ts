class RequestNotFoundError extends Error {
    levelId: string;

    constructor(levelId: string) {
        super(`Request with id '${levelId}' not found.`);
        this.levelId = levelId;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, RequestNotFoundError);
        }
        Object.setPrototypeOf(this, RequestNotFoundError.prototype);
        this.name = this.constructor.name;
    }
}

export default RequestNotFoundError;