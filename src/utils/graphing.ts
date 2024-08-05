import Service from "../services/Service";
import config from "../../config";
import {
    dollarize,
    formatDate,
    getETCComponentsPreviousDay,
    getNextMidnightTimestampET,
    timestampToETCComponents
} from "./helpers";
import {Chart} from "chart.js";
import {renderPortfolio, renderStockChart} from "./canvasses";

Chart.defaults.color = '#fff';

async function createCandlestickStockImage(ticker: string): Promise<Buffer> {
    const service = Service.getInstance();

    const d = new Date();
    d.setDate(d.getDate() - config.game.chartsDaysBack);
    const dateString = d.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    });
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
                }],
                fontColor: '#FFFFFF'
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

    return await renderStockChart(configuration);
}

async function createLinePortfolioImage(uid: string) {
    // first, we need to calculate the timestamp for config.game.chartsDaysBack days ago
    const {year, month, date} = getETCComponentsPreviousDay();
    const startTimestamp = getNextMidnightTimestampET(year, month, date);

    const portfolio = await Service.getInstance().users.getUserPortfolio(uid);
    const labels: string[] = [formatDate(year, month, date + 1)];
    const dataPoints: number[] = [Math.round((portfolio?.portfolioValue() || 0) / 100)];

    for (let i = 0; i < config.game.chartsDaysBack - 1; i++) { // TODO switch to fast algorithm...
        const timestamp = startTimestamp - 86400000 * i;
        const portfolio = await Service.getInstance().users.getUserPortfolioTimestamp(uid, timestamp);
        const {year: y, month: m, date: d} = timestampToETCComponents(timestamp);
        labels.unshift(formatDate(y, m, d - 1));
        dataPoints.unshift(Math.round((await portfolio?.portfolioValueOn(y, m, d - 1) || 0) / 100));
    }

    let borderColor = config.colors.green; // Default to red
    if (dataPoints.length >= 2) {
        const lastValue = dataPoints.at(-1);
        const secondLastValue = dataPoints.at(-2);
        if (lastValue !== undefined && secondLastValue !== undefined) {
            borderColor = lastValue >= secondLastValue ? config.colors.green : config.colors.red;
        }
    }

    const configuration: any = {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Portfolio Value',
                data: dataPoints,
                fill: false,
                borderColor,
                tension: 0.2
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            },
            elements: {
                point: {
                    radius: 0
                }
            }
        }
    };

    return await renderPortfolio(configuration);
}

export {createCandlestickStockImage, createLinePortfolioImage};
