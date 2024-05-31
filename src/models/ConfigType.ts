export type ConfigType = {
    bot: {
        clientID: string;
        guildID: string;
    };
    colors: {
        green: `#${string}`;
        red: `#${string}`;
    };
    game: {
        startingBalance: number;
    };
};

export default ConfigType;