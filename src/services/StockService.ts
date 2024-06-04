import DAOs from "../models/DAOs";
import {Pool} from "pg";
import Stock from "../models/stock/Stock";
import {getETCComponents, getETCComponentsPreviousDay} from "../utils/helpers";
import Price from "../models/Price";

class StockService {
    private daos: DAOs;
    private pool: Pool;

    constructor(daos: DAOs, pool: Pool) {
        this.daos = daos;
        this.pool = pool;
    }

    public async getStock(ticker: string): Promise<Stock | null> {
        const pc = await this.pool.connect();
        const res = await this.daos.stocks.getStock(pc, ticker);
        pc.release();
        return res;
    }

    public async createStock(stock: Stock): Promise<void> {
        const pc = await this.pool.connect();
        const res = await this.daos.stocks.createStock(pc, stock);
        pc.release();
        return res;
    }

    public async updateStock(ticker: string, stock: Partial<Stock>): Promise<void> {
        const pc = await this.pool.connect();
        const res = await this.daos.stocks.updateStock(pc, ticker, stock);

        // Possibly update price history as well
        if (stock.price) {
            const {year, month, date} = getETCComponents();
            const priceHistory: Price = {ticker, year, month, date, price: stock.price};
            if (await this.daos.stocks.getPriceHistory(pc, ticker, year, month, date)) {
                await this.daos.stocks.updatePriceHistory(pc, ticker, year, month, date, priceHistory);
            } else {
                await this.daos.stocks.createPriceHistory(pc, priceHistory);
            }
        }

        pc.release();
        return res;
    }

    public async getAllStocks(): Promise<Stock[]> {
        const pc = await this.pool.connect();
        const res = await this.daos.stocks.getAllStocks(pc);
        pc.release();
        return res;
    }

    public async getAllYesterdayPrice(): Promise<Price[]> {
        const pc = await this.pool.connect();
        const {year, month, date} = getETCComponentsPreviousDay();
        const res = await this.daos.stocks.getPriceHistoryDay(pc, year, month, date);
        pc.release();
        return res;
    }

    public async getYesterdayPrice(ticker: string): Promise<Price | null> {
        const pc = await this.pool.connect();
        const {year, month, date} = getETCComponentsPreviousDay();
        const res = await this.daos.stocks.getPriceHistory(pc, ticker, year, month, date);
        pc.release();
        return res;
    }
}

export default StockService;
