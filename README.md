# The Wolf of Ayup

A Discord bot that simulated a live stock market for 1,000+ concurrent players. Stocks were parodies of real companies, but prices were backed by live Yahoo Finance data through a per-stock multiplier, so real-world market moves actually affected the game economy. Ran as a Discord event with fictional news articles driving player behavior.

<p align="center">
  <img src="assets/pictures/coli_stock.png" width="380" alt="Stock lookup with candlestick chart" />
  <img src="assets/pictures/sabux_stock.png" width="380" alt="Stock lookup with candlestick chart" />
</p>

## How It Works

### Market Data
Each stock maps to a real Yahoo Finance ticker and is scaled by a per-stock multiplier. Daily OHLC price history is tracked in PostgreSQL and used to render the candlestick charts. Prices are stored as integers (cents) to avoid floating-point errors.

### Trading Hours
The bot mirrors real U.S. market hours with four phases: pre-market (2:00 AM–9:30 AM ET, higher volatility with a price sync from Yahoo Finance), regular trading (9:30 AM–4:00 PM), after-hours (4:00 PM–10:00 PM), and close at 10:00 PM. Close triggers a nightly batch: interest accrual, credit tier reassignment, and Discord role updates across all players.

### Credit & Lending
Players get a credit line from a fictional lender ("Ayup Express") with daily compounding interest. Card tiers (Blue through Centurion) are recalculated nightly based on net worth percentile and reflected as Discord roles.

### Charts
Stock charts and portfolio graphs are rendered server-side using Chart.js and `chartjs-node-canvas`, no browser needed. The output is an image buffer attached directly to Discord embeds.

<p align="center">
  <img src="assets/pictures/profile.png" width="380" alt="Player profile with portfolio chart" />
  <img src="assets/pictures/stimmy.png" width="380" alt="Cash check item" />
</p>

### Items & Collectibles
A collectible card system with weighted random pulls, cashable checks of varying denominations, and credit cards with the player's username dynamically rendered on the card image via the Canvas API.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js, TypeScript |
| Bot Framework | Discord.js 14 |
| Database | PostgreSQL (pooled connections, SSL) |
| Financial Data | Yahoo Finance API (`yahoo-finance2`) |
| Charting | Chart.js, `chartjs-node-canvas`, `chartjs-chart-financial` |
| Image Processing | node-canvas |
| Scheduling | node-cron (timezone-aware) |

## Features

- **49 parody stock tickers** with custom logos, each mapped to a real Yahoo Finance symbol
- Prices stored in cents (integer arithmetic) to avoid floating-point errors
- PostgreSQL connection pooling (max 20) with idle timeout management
- Timestamped stock holdings enabling historical portfolio reconstruction
- Paginated embed navigation with interactive Discord buttons and 20-second confirmation timeouts
- Transaction logging to a dedicated Discord channel for audit visibility
- Automatic database schema initialization on first run

