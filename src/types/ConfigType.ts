export type ConfigType = {
    bot: {
        clientID: string;
        guildID: string;
        channels: {
            info: string | null;
            log: string | null;
        };
        messages: {
            priceBoard: string | null;
        };
        newsAmountTruncate: number;
        newsLengthTruncate: number;
        leaderboardSize: number;
        useEphemeralPurchase: boolean;
    };
    theme: {
        financialCompanyName: string;
        financialCompanyTicker: string;
        financialCompanyLogo: string;
        financialCompanyColor: `#${string}`;
    }
    colors: {
        green: `#${string}`;
        red: `#${string}`;
        blue: `#${string}`;
    };
    game: {
        startingBalance: number;
        startingCreditLimit: number;
        randomWalkVolatility: number;
        randomWalkInterval: number;
        randomWalkAmount: number;
        minimumStockPrice: number;
        chartsDaysBack: number;
        etcOffset: number;
        loanMaxMultiplier: number;
        creditDailyInterestPercent: number;
        defaultCreditCardItem: string;
    }
};

export default ConfigType;