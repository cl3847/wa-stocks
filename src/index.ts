import DatabaseHandler from "src/handlers/DatabaseHandler"

async function test() {
    let db = DatabaseHandler.getInstance();
    console.log((await db.users.getUserPortfolio("297798128340566016"))?.netWorth());
    console.log(await db.stocks.getAllStocks())
}

test();