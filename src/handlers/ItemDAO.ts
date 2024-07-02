import {PoolClient} from "pg";
import Item from "../models/item/Item";

class ItemDAO {
    public async getItem(pc: PoolClient, itemId: string): Promise<Item> {
        const query = "SELECT * FROM items WHERE item_id = $1";
        const params = [itemId];
        const result = await pc.query(query, params);
        return result.rows[0] || null;
    }
}

export default ItemDAO;