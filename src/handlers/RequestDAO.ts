import {PoolClient} from "pg";
import Request from "../models/request/Request";

class RequestDAO {
    public async createRequest(pc: PoolClient, request: Request): Promise<void> {
        const keyString = Object.keys(request).join(", ");
        const valueString = Object.keys(request).map((_, index) => `$${index + 1}`).join(", ");
        const query = `INSERT INTO requests (${keyString}) VALUES (${valueString})`;
        const params = Object.values(request);
        await pc.query(query, params);
    }

    public async getRequest(pc: PoolClient, levelId: string): Promise<Request | null> {
        const query = `SELECT * FROM requests WHERE level_id = $1`;
        const params = [levelId];
        const result = await pc.query(query, params);
        return result.rows[0] || null;
    }

    public async updateRequest(pc: PoolClient, levelId: string, request: Partial<Request>): Promise<void> {
        if (Object.keys(request).length === 0) {
            throw new Error("No fields to update");
        }
        const fields = Object.keys(request).map((key, index) => `${key} = $${index + 1}`).join(', ');
        const query = `UPDATE requests SET ${fields} WHERE level_id = $${Object.keys(request).length + 1}`;
        const params = [...Object.values(request), levelId];
        await pc.query(query, params);
    }
}

export default RequestDAO;