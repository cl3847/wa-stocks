import Transaction from "./Transaction";

interface WireTransaction extends Transaction {
    balance_change: number;
    destination: string;
    is_destination_user: boolean;
    memo: string | null;
}

export default WireTransaction;