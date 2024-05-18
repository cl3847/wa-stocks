import * as sqlite3 from "sqlite3";
import UserHandler from "./UserHandler";
import StockHandler from "./StockHandler";

class DatabaseHandler {
    private static instance: DatabaseHandler;

    private readonly db: sqlite3.Database;
    public users: UserHandler;
    public stocks: StockHandler;

    private constructor() {
        this.db = new sqlite3.Database('db/data.db', sqlite3.OPEN_READWRITE);
        this.users = new UserHandler(this.db);
        this.stocks = new StockHandler(this.db);
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