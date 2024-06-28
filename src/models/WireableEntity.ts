import WireTransaction from "./transaction/WireTransaction";

interface WireableEntity {
    onWire(transaction: WireTransaction): Promise<void>;
}

export default WireableEntity;