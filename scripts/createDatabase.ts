const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('db/data.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);

db.serialize(() => {
    db.run("CREATE TABLE users (" +
        "uid TEXT PRIMARY KEY," +
        "balance INT NOT NULL DEFAULT 0" +
        ")"
    );

    db.run("CREATE TABLE stocks (" +
        "ticker TEXT PRIMARY KEY," +
        "stock_ticker TEXT NOT NULL," +
        "multiplier INT DEFAULT 1," +
        "stock_price INT NOT NULL," +
        "name TEXT NOT NULL," +
        "last_price_update INT DEFAULT 0" +
        ")"
    );

    db.run("CREATE TABLE users_stocks (" +
        "uid TEXT NOT NULL," +
        "ticker TEXT NOT NULL," +
        "quantity INT NOT NULL DEFAULT 0," +
        "PRIMARY KEY (uid, ticker)," +
        "FOREIGN KEY(uid) REFERENCES user(uid) ON UPDATE CASCADE ON DELETE CASCADE," +
        "FOREIGN KEY(ticker) REFERENCES stock(ticker) ON UPDATE CASCADE ON DELETE CASCADE" +
        ")")
});

db.close();