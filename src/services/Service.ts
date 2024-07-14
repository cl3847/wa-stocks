import UserService from "../services/UserService";
import TransactionService from "../services/TransactionService";
import DAOs from "../models/DAOs";
import {Pool} from "pg";
import StockService from "./StockService";
import Stock from "../models/stock/Stock";
import GameService from "./GameService";
import ItemService from "./ItemService";

class Service {
    users: UserService;
    stocks: StockService;
    transactions: TransactionService;
    items: ItemService;
    game: GameService;
    pool: Pool;

    private static _stockTickerList: Stock[];
    private static instance: Service;

    constructor(daos: DAOs, pool: Pool) {
        this.pool = pool;
        this.users = new UserService(daos, pool);
        this.transactions = new TransactionService(daos, pool);
        this.stocks = new StockService(daos, pool);
        this.game = new GameService(daos, pool);
        this.items = new ItemService(daos, pool);
    }

    public static async init(DAOs: DAOs, pool: Pool) {
        if (this.instance) {
            throw new Error("Services already initialized");
        }
        this.instance = new Service(DAOs, pool);
        this._stockTickerList = await this.instance.stocks.getAllStocks();
    }

    public static getInstance() {
        if (!this.instance) {
            throw new Error("Services not initialized");
        }
        return this.instance;
    }

    static get stockTickerList(): Stock[] {
        if (!this.instance) {
            throw new Error("Services not initialized");
        }
        return this._stockTickerList;
    }
}

export default Service;