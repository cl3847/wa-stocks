import UserDAO from "../handlers/UserDAO";
import StockDAO from "../handlers/StockDAO";
import TransactionDAO from "../handlers/TransactionDAO";
import ObjectDAO from "../handlers/ObjectDAO";

interface DAOs {
    users: UserDAO;
    stocks: StockDAO;
    transactions: TransactionDAO;
    objects: ObjectDAO;
}

export default DAOs;