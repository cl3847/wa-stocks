import fs from "node:fs";
import ItemAction from "../models/item/ItemAction";
import path from "node:path";
import log from "../utils/logger";

const actions: Map<string, ItemAction[]> = new Map();
const foldersPath = path.join(__dirname);
const itemsFolders = fs.readdirSync(foldersPath);
for (const folder of itemsFolders) {
    if (folder.endsWith(".ts")) continue;
    const itemsFiles = fs.readdirSync(`${foldersPath}/${folder}`).filter(file => file.endsWith('.ts'));
    for (const file of itemsFiles) {
        const pair: {itemIds: string[], action: ItemAction} = require(`./${folder}/${file}`);
        for (let id of pair.itemIds) {
            const actionsArray = actions.get(id) || [];
            actionsArray.push(pair.action);
            actions.set(id, actionsArray);
            log.info(`Loaded action ${pair.action.identifier} for item with id ${id}`);
        }
    }
}

export default actions;