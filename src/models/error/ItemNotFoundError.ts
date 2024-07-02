class ItemNotFoundError extends Error {
    item_id: string;

    constructor(item_id: string) {
        super(`Item with id '${item_id}' not found.`);
        this.item_id = item_id;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ItemNotFoundError);
        }
        Object.setPrototypeOf(this, ItemNotFoundError.prototype);
        this.name = this.constructor.name;
    }
}

export default ItemNotFoundError;