import UserDAO from "../handlers/UserDAO";
import StockDAO from "../handlers/StockDAO";
import UserService from "../services/UserService";

type HeldStock = Stock & UserStock;

interface DAOs {
    users: UserDAO;
    stocks: StockDAO;
}

interface Services {
    users: UserService;
}

export {HeldStock, DAOs, Services};
