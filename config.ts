import ConfigType from "./src/models/ConfigType";

const config: ConfigType = {
  "bot": {
    "clientID": "1245583548258451516", // The client ID of the bot
    "guildID": "1245589131405299802" // The guild for the game to be played in
  },
  "colors": {
    "green": `#00c805`,
    "red": `#ff5001`,
  },
  "game": {
    "startingBalance": 1000, // Starting balance in CENTS
  }
};

export default config;