import ConfigType from "./src/types/ConfigType";

require('dotenv').config();

const config: ConfigType = {
    "bot": {
        "clientID": process.env.CLIENT_ID ?? "1245583548258451516", // The client ID of the bot
        "guildID": "1263907687146590228", // The guild for the game to be played in
        channels: {
            "info": "1263909750278586511",
            "log": "1263909821753852047"
        },
        messages: {
            "priceBoard": "1266613165941325834",
            "leaderboard": "1266613130356850790"
        },
        newsAmountTruncate: 6,
        newsLengthTruncate: 40,
        leaderboardSizeTop: 20,
        leaderboardSizeBottom: 10,
        useEphemeralPurchase: true,
        useEphemeralWire: true,
        maxProfileHoldingsDisplay: 15,
        baseRoleId: "1267307202927132794"
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
        "minHeldWire": 10000000,
        "startingCreditLimit": 20000000, // Starting credit limit in CENTS
        "randomWalkVolatility": 0.0025,
        "randomWalkInterval": 1, // In minutes
        "randomWalkAmount": 15, // Number of stocks to randomly walk
        "minimumStockPrice": 1,
        "chartsDaysBack": 15, // Number of days to show in the price chart
        "etcOffset": 4,
        "loanMaxMultiplier": 4,
        "creditDailyInterestPercent": 4,
        "maxRequestId": 120000000,
        "defaultItems": [
            {item: "000", quantity: 1},
            {item: "900", quantity: 1},
        ],
        "randomWalkBias":  1,
        "minimumLevelRequestAmount": 2000000,
    },
};

export default config;