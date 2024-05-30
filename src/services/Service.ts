import UserService from "../services/UserService";
import TransactionService from "../services/TransactionService";
import DAOs from "../models/DAOs";
import {Pool} from "pg";
import StockService from "./StockService";

class Service {
    users: UserService;
    stocks: StockService;
    transactions: TransactionService;

    private static instance: Service;

    constructor(daos: DAOs, pool: Pool) {
        this.users = new UserService(daos, pool);
        this.transactions = new TransactionService(daos, pool);
        this.stocks = new StockService(daos, pool);
    }

    public static init(DAOs: DAOs, pool: Pool) {
        if (this.instance) {
            throw new Error("Services already initialized");
        }
        this.instance = new Service(DAOs, pool);
    }

    public static getInstance() {
        if (!this.instance) {
            throw new Error("Services not initialized");
        }
        return this.instance;
    }
}

export default Service;