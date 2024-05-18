import DatabaseHandler from "src/handlers/DatabaseHandler"

async function test() {
    let db = DatabaseHandler.getInstance();
    console.log(await db.stocks.getStock("AYUP"));
}

test();