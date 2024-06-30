import Stock from "../models/stock/Stock";
import UserStock from "../models/user/UserStock";

type HeldStock = Stock & UserStock;

export default HeldStock;