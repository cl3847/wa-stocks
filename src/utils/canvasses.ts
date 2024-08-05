// Re-use one service, or as many as you need for different canvas size requirements
import {ChartJSNodeCanvas} from "chartjs-node-canvas";
import {freshRequire} from "chartjs-node-canvas/src/freshRequire";

const portfolioCanvas = new ChartJSNodeCanvas({width: 600, height: 300});
const stockChartCanvas = new ChartJSNodeCanvas({width: 600, height: 300,
    plugins: {
        modern: ['chartjs-chart-financial'],
        globalVariableLegacy: ['chartjs-adapter-luxon']
    }
});

// Needs to run after the constructor but before any render function
(global as any).window = (global as any).window || {};
(global as any).window.luxon = freshRequire('luxon'); // Can just use normal require();

async function renderPortfolio(configuration: any) {
    return await portfolioCanvas.renderToBuffer(configuration);
}
async function renderStockChart(configuration: any) {
    return await stockChartCanvas.renderToBuffer(configuration);
}

// Expose just the 'render' methods to downstream code so they don't have to worry about life-cycle management.
export {
    renderPortfolio,
    renderStockChart,
};