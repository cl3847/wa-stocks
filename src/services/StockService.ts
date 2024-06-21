import DAOs from "../models/DAOs";
import {Pool, PoolClient} from "pg";
import Stock from "../models/stock/Stock";
import {getETCComponentsPreviousDay} from "../utils/helpers";
import Price from "../models/Price";
import StockNotFoundError from "../models/error/StockNotFoundError";
import log from "../utils/logger";
import yahooFinance from "yahoo-finance2";
import UserStock from "../models/user/UserStock";

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
        const res = await this.daos.stocks.getAllPriceHistoriesDay(pc, year, month, date);
        pc.release();
        return res;
    }

    public async getAllPriceHistoriesDay(year: number, month: number, date: number): Promise<Price[]> {
        const pc = await this.pool.connect();
        const res = await this.daos.stocks.getAllPriceHistoriesDay(pc, year, month, date);
        pc.release();
        return res;
    }

    public async getYesterdayPrice(ticker: string): Promise<Price | null> {
        const pc = await this.pool.connect();
        const {year, month, date} = getETCComponentsPreviousDay();
        const res = await this.daos.stocks.getStockPriceHistory(pc, ticker, year, month, date);
        pc.release();
        return res;
    }

    public async synchronizeStockPrice(ticker: string, suppliedPc?: PoolClient): Promise<void> {
        const pc = suppliedPc || await this.pool.connect();
        const stock = await this.daos.stocks.getStock(pc, ticker);
        if (!stock) throw new StockNotFoundError(ticker);
        log.info(`Synchronizing stock price for ${ticker}`);
        try {
            const quote = await yahooFinance.quoteSummary(stock.stock_ticker);
            if (!quote.price || !quote.price.regularMarketPrice) {
                log.error(`Error synchronizing stock price for ${ticker}: No price found`);
            } else {
                const priceCents = Math.floor(quote.price.regularMarketPrice * 100);
                await this.daos.stocks.updateStock(pc, ticker, {
                    price: Math.floor(priceCents * stock.multiplier),
                    stock_price: priceCents,
                    last_update_timestamp: Math.floor(Date.now() / 1000)
                });
                log.success(`Synchronized stock price for ${ticker}`)
            }
        } catch(err) {
            log.error(`Error synchronizing stock price for ${ticker}: ${err.message}`);
            throw err;
        } finally {
            if (!suppliedPc) pc.release();
        }
    }

    public async synchronizeAllStockPrices() {
        const pc = await this.pool.connect();
        try {
            await pc.query('BEGIN');
            for (const stock of await this.daos.stocks.getAllStocks(pc)) {
                await this.synchronizeStockPrice(stock.ticker, pc);
            }
            await pc.query('COMMIT');
        } catch (err) {
            log.error(`Error synchronizing all stock prices, rolling back: ${err.message}`);
            await pc.query('ROLLBACK');
        } finally {
            pc.release();
        }
    }

    public async getStockPriceHistoryAfterDay(ticker: string, year: number, month: number, date: number): Promise<Price[]> {
        const pc = await this.pool.connect();
        const res = await this.daos.stocks.getStockPriceHistoryAfterDay(pc, ticker, year, month, date);
        pc.release();
        return res;
    }

    public async getTopShareholders(ticker: string, limit: number): Promise<UserStock[]> {
        const pc = await this.pool.connect();
        const res = await this.daos.stocks.getTopShareholders(pc, ticker, limit);
        pc.release();
        return res;
    }
}

export default StockService;
