 import fs from "node:fs";
import WireableEntity from "../models/wire/WireableEntity";
 import log from "../utils/logger";

const entities: Map<string, WireableEntity> = new Map();
const entityFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.ts') && file !== 'entities.controller.ts');
for (const file of entityFiles) {
    const entity: WireableEntity = require(`./${file}`);
    entities.set(entity.identifier, entity);
    log.info('Loaded entity: ' + entity.name);
}

export default entities;