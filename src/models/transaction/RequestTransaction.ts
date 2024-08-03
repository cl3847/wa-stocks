import Transaction from "./Transaction";

interface RequestTransaction extends Transaction {
    balance_change: number;
    destination: string;
    price: number;
}

export default RequestTransaction;
