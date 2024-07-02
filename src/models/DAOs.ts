import UserDAO from "../handlers/UserDAO";
import StockDAO from "../handlers/StockDAO";
import TransactionDAO from "../handlers/TransactionDAO";
import ObjectDAO from "../handlers/ObjectDAO";
import ItemDAO from "../handlers/ItemDAO";

interface DAOs {
    users: UserDAO;
    stocks: StockDAO;
    transactions: TransactionDAO;
    objects: ObjectDAO;
    items: ItemDAO;
}

export default DAOs;