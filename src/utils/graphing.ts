import Service from "../services/Service";
import config from "../../config";
import {dollarize} from "./helpers";
import {ChartJSNodeCanvas} from "chartjs-node-canvas";
import {freshRequire} from "chartjs-node-canvas/src/freshRequire";

async function createCandlestickStockImage(ticker: string): Promise<Buffer> {
    const service = Service.getInstance();

    const d = new Date();
    d.setDate(d.getDate() - config.game.chartsDaysBack);
    const dateString = d.toLocaleString('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'numeric', day: 'numeric' });
    const [month, date, year] = dateString.split('/').map(x => parseInt(x));
    if (!year || !month || !date) throw new Error('Error parsing date components.');
    const priceHistory = (await service.stocks.getStockPriceHistoryAfterDay(ticker, year, month, date)).map(price => {
        return {
            x: new Date(price.year, price.month - 1, price.date).getTime(),
            o: dollarize(price.open_price),
            h: dollarize(price.high_price),
            l: dollarize(price.low_price),
            c: dollarize(price.close_price)
        }
    });

    const width = 800;
    const height = 400;
    const chartJSNodeCanvas = new ChartJSNodeCanvas({
        width, height, plugins: {
            modern: [ 'chartjs-chart-financial' ],
            globalVariableLegacy: [ 'chartjs-adapter-luxon' ]
        }
    });

    // Needs to run after the constructor but before any render function
    (global as any).window = (global as any).window || {};
    (global as any).window.luxon = freshRequire('luxon'); // Can just use normal require();

    const configuration: any = {
        type: 'candlestick',
        data:
            {
                datasets: [{
                    label: `${ticker} Price History`,
                    data: priceHistory,
                    borderWidth: 3,
                    color: {
                        up: config.colors.green,
                        down: config.colors.red,
                        unchanged: 'rgba(90, 90, 90, 1)'
                    },
                    borderColor: {
                        up: config.colors.green,
                        down: config.colors.red,
                        unchanged: 'rgba(90, 90, 90, 1)'
                    }

                }]
            },
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    }
                },
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    };

    return await chartJSNodeCanvas.renderToBuffer(configuration);
}

export { createCandlestickStockImage };