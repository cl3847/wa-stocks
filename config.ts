import ConfigType from "./src/types/ConfigType";

require('dotenv').config();

const config: ConfigType = {
    "bot": {
        "clientID": process.env.CLIENT_ID ?? "1245583548258451516", // The client ID of the bot
        "guildID": "1245589131405299802", // The guild for the game to be played in
        channels: {
            "info": "1246710130033033306",
            "log": "1255619460040097914"
        },
        messages: {
            "priceBoard": "1246713065379074138",
        },
        newsAmountTruncate: 3,
        newsLengthTruncate: 42,
        leaderboardSize: 10,
        useEphemeralPurchase: false,
    },
    "theme": {
        financialCompanyName: "Ayup Express",
        financialCompanyTicker: "AYXP",
        financialCompanyLogo: "AYXP",
        financialCompanyColor: `#016FD0`
    },
    "colors": {
        "green": `#00c805`,
        "red": `#ff5001`,
        "blue": `#5865f2`
    },
    "game": {
        "startingBalance": 10000000, // Starting balance in CENTS
        "startingCreditLimit": 40000000, // Starting credit limit in CENTS
        "randomWalkVolatility": 0.005,
        "randomWalkInterval": 1, // In minutes
        "randomWalkAmount": 10, // Number of stocks to randomly walk
        "minimumStockPrice": 1,
        "chartsDaysBack": 15, // Number of days to show in the price chart
        "etcOffset": 4,
        "loanMaxMultiplier": 4,
        "creditDailyInterestPercent": 1,
        "defaultItems": [
            {item: "000", quantity: 1},
            {item: "900", quantity: 1},
        ]
    },
};

export default config;