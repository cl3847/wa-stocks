import Transaction from "./Transaction";

interface WireTransaction extends Transaction {
    balance_used: number | null;
    destination: string;
    is_destination_user: boolean;
}

export default WireTransaction;