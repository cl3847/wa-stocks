import * as sqlite3 from "sqlite3";

class UserHandler {
    private db: sqlite3.Database;

    constructor(db: sqlite3.Database) {
        this.db = db;
    }

    /**
     * Writes a User object to the database
     * @param {User} user The user for which to write to the database
     * @returns {Promise<void>} A promise resolving to nothing
     */
    public async createUser(user: User): Promise<void> {
        return new Promise((resolve, reject) => {
            const keyString = Object.keys(user).join(", ");
            const placeholderString = Object.keys(user).fill('?').join(", ");
            const query = `INSERT INTO users (${keyString}) VALUES (${placeholderString})`;
            const params = Object.values(user);
            this.db.run(query, params, (err) => {
                if (err) reject(err);
                else resolve();
            })
        })
    }

    /**
     * Gets a user corresponding to a specific UID
     * @param {string} uid The UID of the user for which to get
     * @returns {Promise<User | null>} A promise resolving to a User if a user with the UID exists, otherwise null
     */
    public async getUser(uid: string): Promise<User | null> {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM users WHERE uid = $uid";
            const params = {$uid: uid};
            this.db.get(query, params, (err, row: User) => {
                if (err) reject(err);
                else resolve(row || null);
            });
        });
    }

    /**
     * Updates a user corresponding to a specific UID
     * @param {string} uid The UID of the user for which to update
     * @param {Partial<User>} user The fields to update in the user
     * @returns {Promise<void>} A promise resolving to nothing
     */
    public async updateUser(uid: string, user: Partial<User>): Promise<void> {
        return new Promise((resolve, reject) => {
            if (Object.keys(user).length === 0) return reject(new Error("No fields to update"));
            const query = `UPDATE users SET ${Object.keys(user).map(key => `${key} = ?`).join(', ')} WHERE uid = ?`;
            const params = [...Object.values(user), uid];
            this.db.run(query, params, (err) => {
                if (err) reject(err);
                else resolve();
            })
        })
    }

    /**
     * Deletes a user corresponding to a specific UID
     * @param {string} uid The UID of the user for which to delete
     * @returns {Promise<void>} A promise resolving to nothing
     */
    public async deleteUser(uid: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const query = "DELETE FROM users WHERE uid = $uid";
            const params = {$uid: uid};
            this.db.run(query, params, (err) => {
                if (err) reject(err);
                else resolve();
            })
        })
    }
}

export default UserHandler;