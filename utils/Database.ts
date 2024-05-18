import * as sqlite3 from "sqlite3";

class Database {
    static db: sqlite3.Database = new sqlite3.Database('db/data.db', sqlite3.OPEN_READWRITE);

    /**
     * Gets a row from the user table corresponding to a specific user
     * @param uid   The ID of the user from which to fetch the corresponding row
     */
    static async getUser(uid: string): Promise<User | null> {
        return new Promise((resolve, reject) => {
            Database.db.get("SELECT * FROM user WHERE uid = ?", uid, (err, row: User) => {
                if (err) { reject(err) }
                else { resolve(row || null) }
            });
        });
    }
}

export default Database;