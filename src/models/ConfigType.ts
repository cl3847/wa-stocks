export type ConfigType = {
    bot: {
        clientID: string;
        guildID: string;
    };
    colors: {
        green: number;
        red: number;
    };
    game: {
        startingBalance: number;
    };
};

export default ConfigType;