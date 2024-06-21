import Stock from "./Stock";
import UserStock from "../user/UserStock";

type HeldStock = Stock & UserStock;

export default HeldStock;