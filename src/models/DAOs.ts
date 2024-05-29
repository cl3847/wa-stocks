import UserDAO from "../handlers/UserDAO";
import StockDAO from "../handlers/StockDAO";

interface DAOs {
    users: UserDAO;
    stocks: StockDAO;
}

export default DAOs;