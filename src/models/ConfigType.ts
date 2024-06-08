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
    };
    colors: {
        green: `#${string}`;
        red: `#${string}`;
        blue: `#${string}`;
    };
    game: {
        startingBalance: number;
        randomWalkVolatility: number;
        randomWalkInterval: number;
        randomWalkAmount: number;
        minimumStockPrice: number;
    };
};

export default ConfigType;