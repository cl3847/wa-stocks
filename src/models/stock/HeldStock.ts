import Stock from "./Stock";
import UserStock from "../user_stock/UserStock";

type HeldStock = Stock & UserStock;

export default HeldStock;