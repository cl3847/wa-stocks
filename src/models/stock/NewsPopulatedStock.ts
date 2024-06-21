import Stock from "./Stock";
import News from "./News";

interface NewsPopulatedStock extends Stock {
    news: News[];
}

export default NewsPopulatedStock;