import User from "./User";
import HeldStock from "../stock/HeldStock";
import Service from "../../services/Service";
import {getETCComponents} from "../../utils/helpers";

/**
 * A class containing all the information in a User and a listing of all the stock holdings they have
 */
class UserPortfolio implements User {
    uid: string;
    balance: number;
    portfolio: HeldStock[];

    constructor(user: User, portfolio: HeldStock[]) {
        Object.assign(this, user);
        this.portfolio = portfolio;
    }

    /**
     * Calculates the user's net worth
     * @returns {number} The user's net worth
     */
    public netWorth(): number {
        return this.balance + this.portfolio.reduce((acc, stock) => stock.quantity * stock.price + acc, 0);
    }

    public async portfolioValue(): Promise<number> {
        const {year, month, date} = getETCComponents();
        return this.portfolioValueOn(year, month, date);
    }

    public async portfolioValueOn(year: number, month: number, date: number): Promise<number> {
        const stockPriceHistory = await Service.getInstance().stocks.getAllPriceHistoriesDay(year, month, date);
        return this.portfolio.reduce((acc, stock) => {
            const stockPrice = stockPriceHistory.find(price => price.ticker === stock.ticker);
            if (!stockPrice) return acc;
            return stock.quantity * stockPrice.close_price + acc;
        }, 0);
    }
}

export default UserPortfolio;
