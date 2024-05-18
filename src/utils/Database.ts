import * as sqlite3 from "sqlite3";

class Database {
    static db: sqlite3.Database = new sqlite3.Database('db/data.db', sqlite3.OPEN_READWRITE);

    /**
     * Gets a user corresponding to a specific id
     * @param {string} uid The ID of the user for which to get
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

    /**
     * Writes a User object to the database
     * @param {User} user The user for which to write to the database
     * @returns {Promise<void>} A promise resolving to nothing
     */
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