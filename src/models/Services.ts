import UserService from "../services/UserService";
import TransactionService from "../services/TransactionService";

interface Services {
    users: UserService;
    transactions: TransactionService;
}

export default Services;