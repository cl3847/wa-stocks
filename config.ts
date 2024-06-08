import ConfigType from "./src/models/ConfigType";
require('dotenv').config();

const config: ConfigType = {
  "bot": {
    "clientID": process.env.CLIENT_ID ?? "1245583548258451516", // The client ID of the bot
    "guildID": "1245589131405299802", // The guild for the game to be played in
    channels: {
      "info": "1246710130033033306"
    },
    messages: {
      "priceBoard": "1246713065379074138",
    }
  },
  "colors": {
    "green": `#00c805`,
    "red": `#ff5001`,
    "blue": `#5865f2`
  },
  "game": {
    "startingBalance": 100000, // Starting balance in CENTS
    "randomWalkVolatility": 0.005,
    "randomWalkInterval": 1, // In minutes
    "randomWalkAmount": 10, // Number of stocks to randomly walk
    "minimumStockPrice": 1,
  }
};

export default config;