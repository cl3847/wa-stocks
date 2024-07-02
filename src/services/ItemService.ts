import DAOs from "../models/DAOs";
import {Pool} from "pg";
import Item from "../models/item/Item";

class ItemService {
    private daos: DAOs;
    private pool: Pool;

    constructor(daos: DAOs, pool: Pool) {
        this.daos = daos;
        this.pool = pool;
    }

    public async getItem(itemId: string): Promise<Item | null> {
        const pc = await this.pool.connect();
        const res = await this.daos.items.getItem(pc, itemId);
        pc.release();
        return res;
    }
}

export default ItemService;