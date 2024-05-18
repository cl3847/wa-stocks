import * as sqlite3 from "sqlite3";

class Database {
    static db: sqlite3.Database = new sqlite3.Database('db/data.db', sqlite3.OPEN_READWRITE);

    /**
     * Gets a row from the user table corresponding to a specific user
     * @param {string} uid The ID of the user from which to fetch the corresponding row
     * @returns {Promise<User | null>} A promise resolving to a User if a user with the uid exists, otherwise null
     */
    static async getUser(uid: string): Promise<User | null> {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM user WHERE uid = $uid";
            const params = {$uid: uid};
            Database.db.get(query, params, (err, row: User) => {
                if (err) { reject(err) }
                else { resolve(row || null); }
            });
        });
    }

    static async createUser(user: User): Promise<void> {
        return new Promise((resolve, reject) => {
            const query = "INSERT INTO user (uid, balance) VALUES ($uid, $balance)";
            const params = {$uid: user.uid, $balance: user.balance};
            Database.db.run(query, params, (err) => {
                if (err) { reject(err) }
                else { resolve(); }
            })
        })
    }
}

export default Database;