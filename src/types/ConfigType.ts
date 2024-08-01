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
            leaderboard: string | null;
        };
        newsAmountTruncate: number;
        newsLengthTruncate: number;
        leaderboardSizeTop: number;
        leaderboardSizeBottom: number;
        useEphemeralPurchase: boolean;
        useEphemeralWire: boolean;
        maxProfileHoldingsDisplay: number;
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
        minHeldWire: number;
        startingCreditLimit: number;
        randomWalkVolatility: number;
        randomWalkInterval: number;
        randomWalkAmount: number;
        minimumStockPrice: number;
        chartsDaysBack: number;
        etcOffset: number;
        loanMaxMultiplier: number;
        creditDailyInterestPercent: number;
        defaultItems: {item: string, quantity: number}[];
        randomWalkBias: number;
    }
};

export default ConfigType;