import config from "../../config";

function maxLoanAmount(netWorth: number, loan_balance: number): number {
    return netWorth * config.game.loanMaxMultiplier - loan_balance;
}

export {
    maxLoanAmount
}