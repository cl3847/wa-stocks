import {HeldStock} from "./types";

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
}

export default UserPortfolio;
