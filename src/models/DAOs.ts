import UserDAO from "../handlers/UserDAO";
import StockDAO from "../handlers/StockDAO";
import TransactionDAO from "../handlers/TransactionDAO";
import ObjectDAO from "../handlers/ObjectDAO";
import ItemDAO from "../handlers/ItemDAO";
import RequestDAO from "../handlers/RequestDAO";

interface DAOs {
    users: UserDAO;
    stocks: StockDAO;
    transactions: TransactionDAO;
    objects: ObjectDAO;
    items: ItemDAO;
    requests: RequestDAO;
}

export default DAOs;