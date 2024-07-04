import ConfigType from "./src/types/ConfigType";

require('dotenv').config();

const config: ConfigType = {
    "bot": {
        "clientID": process.env.CLIENT_ID ?? "1245583548258451516", // The client ID of the bot
        "guildID": "529472851070156801", // The guild for the game to be played in
        channels: {
            "info": "1257801641495625788",
            "log": "1257801711288975380"
        },
        messages: {
            "priceBoard": "1257804705871167641",
        },
        newsAmountTruncate: 3,
        newsLengthTruncate: 42,
        leaderboardSizeTop: 10,
        leaderboardSizeBottom: 10,
        useEphemeralPurchase: true,
        useEphemeralWire: true,
        maxProfileHoldingsDisplay: 15
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
        "startingCreditLimit": 20000000, // Starting credit limit in CENTS
        "randomWalkVolatility": 0.0025,
        "randomWalkInterval": 1, // In minutes
        "randomWalkAmount": 15, // Number of stocks to randomly walk
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