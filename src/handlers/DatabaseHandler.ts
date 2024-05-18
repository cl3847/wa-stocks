import * as sqlite3 from "sqlite3";
import UserHandler from "./UserHandler";

class DatabaseHandler {
    private static instance: DatabaseHandler;

    private readonly db: sqlite3.Database;
    public user: UserHandler;

    private constructor() {
        this.db = new sqlite3.Database('db/data.db', sqlite3.OPEN_READWRITE);
        this.user = new UserHandler(this.db);
    }

    /**
     * Creates and returns a connection instance to the database if it doesn't exist, otherwise returns the existing instance
     * @returns {DatabaseHandler} The DatabaseHandler instance that is connected to the database
     */
    public static getInstance(): DatabaseHandler {
        if (!DatabaseHandler.instance) {
            DatabaseHandler.instance = new DatabaseHandler();
        }
        return DatabaseHandler.instance;
    }
}

export default DatabaseHandler;