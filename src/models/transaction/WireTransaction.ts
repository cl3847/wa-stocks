import Transaction from "./Transaction";

interface WireTransaction extends Transaction {
    balance_change: number | null;
    destination: string;
    is_destination_user: boolean;
}

export default WireTransaction;