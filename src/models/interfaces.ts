import UserDAO from "../handlers/UserDAO";
import StockDAO from "../handlers/StockDAO";
import UserService from "../services/UserService";

interface StockHolding extends Stock {
    quantity: number;
}

interface DAOs {
    users: UserDAO;
    stocks: StockDAO;
}

interface Services {
    users: UserService;
}

export {StockHolding, DAOs, Services};
