import User from "./User";
import HeldStock from "../stock/HeldStock";
import Service from "../../services/Service";
import {getETCComponentsPreviousDay, getNextMidnightTimestampET} from "../../utils/helpers";

/**
 * A class containing all the information in a User and a listing of all the stock holdings they have
 */
class UserPortfolio implements User {
    uid: string;
    balance: number;
    loan_balance: number;
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
        return this.balance + this.portfolioValue();
    }

    public portfolioValue(): number {
        return this.portfolio.reduce((acc, stock) => stock.quantity * stock.price + acc, 0);
    }

    public async portfolioValueOn(year: number, month: number, date: number): Promise<number> {
        const stockPriceHistory = await Service.getInstance().stocks.getAllPriceHistoriesDay(year, month, date);
        return this.portfolio.reduce((acc, stock) => {
            const stockPrice = stockPriceHistory.find(price => price.ticker === stock.ticker);
            if (!stockPrice) return acc;
            return stock.quantity * stockPrice.close_price + acc;
        }, 0);
    }

    public async getDayPortfolioChange(): Promise<{diff: number, percent: number | null }> {
        const {year, month, date} = getETCComponentsPreviousDay();
        const yesterdayPortfolio = await Service.getInstance().users.getUserPortfolioTimestamp(this.uid, getNextMidnightTimestampET(year, month, date));
        const portfolioValue = this.portfolioValue();
        const yesterdayPortfolioValue = await yesterdayPortfolio?.portfolioValueOn(year, month, date);

        const valueDiff = portfolioValue - (yesterdayPortfolioValue ? yesterdayPortfolioValue : 0);
        const valueDiffPercent = yesterdayPortfolioValue ? valueDiff / yesterdayPortfolioValue : null;

        return {diff: valueDiff, percent: valueDiffPercent};
    }
}

export default UserPortfolio;
