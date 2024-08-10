import User from "../models/user/User"
import DAOs from "../models/DAOs";
import {Pool} from "pg";
import UserPortfolio from "../models/user/UserPortfolio";
import UserStock from "../models/user/UserStock";
import config from "../../config";
import HeldItem from "../types/HeldItem";
import Item from "../models/item/Item";
import MissingCreditCardError from "../models/error/MissingCreditCardError";
import ItemNotFoundError from "../models/error/ItemNotFoundError";
import log from "../utils/logger";

class UserService {
    private daos: DAOs;
    private pool: Pool;

    constructor(daos: DAOs, pool: Pool) {
        this.daos = daos;
        this.pool = pool;
    }

    public async initUser(uid: string): Promise<void> {
        const pc = await this.pool.connect();
        try {
            await pc.query("BEGIN");
            const newUser: User = {
                uid,
                balance: config.game.startingBalance,
                loan_balance: 0,
                credit_limit: config.game.startingCreditLimit
            };
            await this.daos.users.createUser(pc, newUser);
            if (config.game.defaultItems) {
                for (const item of config.game.defaultItems) {
                    const newUserItem: UserItem = {
                        uid,
                        item_id: item.item,
                        quantity: item.quantity
                    };
                    await this.daos.users.createItemHolding(pc, newUserItem);
                }
            }
            await pc.query("COMMIT");
        } catch (err) {
            await pc.query('ROLLBACK');
            throw err; // Re-throw to be handled by the caller
        } finally {
            pc.release();
        }


    }

    public async getUser(uid: string): Promise<User | null> {
        const pc = await this.pool.connect();
        const res = await this.daos.users.getUser(pc, uid);
        pc.release();
        return res;
    }

    public async createUser(user: User): Promise<void> {
        const pc = await this.pool.connect();
        const res = await this.daos.users.createUser(pc, user);
        pc.release();
        return res;
    }

    public async updateUser(uid: string, user: Partial<User>): Promise<void>{
        const pc = await this.pool.connect();
        const res = await this.daos.users.updateUser(pc, uid, user);
        pc.release();
        return res;
    }

    public async getUserPortfolio(uid: string): Promise<UserPortfolio | null> {
        const pc = await this.pool.connect();
        const res = await this.daos.users.getUserPortfolio(pc, uid);
        pc.release();
        return res;
    }

    public async getUserInventory(uid: string): Promise<HeldItem[]> {
        const pc = await this.pool.connect();
        const res = await this.daos.users.getInventory(pc, uid);
        pc.release();
        return res;
    }

    public async getUserPortfolioTimestamp(uid: string, timestamp: number): Promise<UserPortfolio | null> {
        const pc = await this.pool.connect();
        const res = await this.daos.users.getUserPortfolioTimestamp(pc, uid, timestamp);
        pc.release();
        return res;
    }

    public async getAllUserPortfolios(): Promise<UserPortfolio[]> {
        const pc = await this.pool.connect();
        const res = await this.daos.users.getAllUserPortfolios(pc);
        pc.release();
        return res;
    }

    public async getUserStockHistoryAfterTimestamp(uid: string, timestamp: number): Promise<UserStock[]> {
        const pc = await this.pool.connect();
        const res = await this.daos.users.getUserStockHistoryAfterTimestamp(pc, uid, timestamp);
        pc.release();
        return res;
    }

    public async updateCreditCard(uid: string, newCardId: string): Promise<boolean> {
        const pc = await this.pool.connect();
        const userInventory = await this.daos.users.getInventory(pc, uid);
        const newItem = await this.daos.items.getItem(pc, newCardId);
        if (!newItem) throw new ItemNotFoundError(newCardId);
        const currentCard = userInventory.find((x: Item) => x.type === "credit_card");
        if (!currentCard) throw new MissingCreditCardError(uid);

        if (currentCard.item_id === newCardId) {
            pc.release();
            return false;
        }

        try {
            await this.daos.users.updateItemHolding(pc, uid, currentCard.item_id, {item_id: newItem.item_id});
            log.success(`Updated ${uid}'s credit card from ${currentCard.item_id} to ${newCardId}`);
            return true;
        } catch (err) {
            log.error("Error updating credit card: " + err);
            throw err;
        } finally {
            pc.release();
        }
    }

    public async updateItemHolding(uid: string, itemId: string, holding: Partial<UserItem>): Promise<void> {
        const pc = await this.pool.connect();
        const res = await this.daos.users.updateItemHolding(pc, uid, itemId, holding);
        pc.release();
        return res;
    }

    public async createItemHolding(holding: UserItem): Promise<void> {
        const pc = await this.pool.connect();
        const res = await this.daos.users.createItemHolding(pc, holding);
        pc.release();
        return res;
    }

    public async getItemHolding(uid: string, itemId: string): Promise<UserItem | null> {
        const pc = await this.pool.connect();
        const res = await this.daos.users.getItemHolding(pc, uid, itemId);
        pc.release();
        return res;
    }

    public async applyInterest(): Promise<void> {
        const pc = await this.pool.connect();
        try {
            return await this.daos.users.applyInterest(pc, config.game.creditDailyInterestMultiplier);
        } finally {
            pc.release();
        }
    }
}

export default UserService;
