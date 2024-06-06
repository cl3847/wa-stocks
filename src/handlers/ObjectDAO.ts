import {PoolClient} from "pg";

class ObjectDAO {
    public async getObject(pc: PoolClient, name: string): Promise<Object> {
        const query = "SELECT * FROM objects WHERE name = $1";
        const params = [name];
        const result = await pc.query(query, params);
        console.log(JSON.parse(result.rows[0]) || null);
        return JSON.parse(result.rows[0]) || null;
    }

    public async createObject(pc: PoolClient, name: string, object: Object): Promise<void> {
        const query = `INSERT INTO objects (name, data) VALUES ($1, $2)`;
        const params = [name, JSON.stringify(object)];
        await pc.query(query, params);
    }

    public async updateObject(pc: PoolClient, name: string, object: Object): Promise<void> {
        const query = `UPDATE objects SET data = $2 WHERE name = $1`;
        const params = [name, JSON.stringify(object)];
        await pc.query(query, params);
    }

    public async deleteObject(pc: PoolClient, name: string): Promise<void> {
        const query = "DELETE FROM objects WHERE name = $1";
        const params = [name];
        await pc.query(query, params);
    }
}

export default ObjectDAO;