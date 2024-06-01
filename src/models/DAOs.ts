import UserDAO from "../handlers/UserDAO";
import StockDAO from "../handlers/StockDAO";
import TransactionDAO from "../handlers/TransactionDAO";

interface DAOs {
    users: UserDAO;
    stocks: StockDAO;
    transactions: TransactionDAO;
}

export default DAOs;