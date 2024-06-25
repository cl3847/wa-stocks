export type ConfigType = {
    bot: {
        clientID: string;
        guildID: string;
        channels: {
            info: string | null;
        };
        messages: {
            priceBoard: string | null;
        };
        newsAmountTruncate: number;
        newsLengthTruncate: number;
    };
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
    };
};

export default ConfigType;