import {ApplicationCommandOptionChoiceData, AutocompleteInteraction} from "discord.js";
import Service from "../services/Service";
import Stock from "../models/stock/Stock";

// this is what appears in the autocomplete options
// regardless of what it says (full name, etc), selecting the option will only fill in the ticker
function formatName(stock: Stock) {
    return `${stock.ticker} / ${stock.name}`
}

async function autocompleteStock(int: AutocompleteInteraction) {
    const stonks = Service.stockTickerList;
    let userInput = int.options.getFocused();

    // no query: list all
    if (userInput.length < 1) {
        return int.respond(stonks.slice(0, 25).map(x => ({ name: formatName(x), value: x.ticker })));
    }

    userInput = userInput.toUpperCase().replace(/\s/g, ""); // convert to uppercase + remove whitespace

    const exactMatches: ApplicationCommandOptionChoiceData[] = []     // starts with user input
    const closeMatches: ApplicationCommandOptionChoiceData[] = []     // contains user input somewhere in it

    // check each stock name to find which ones match user input
    stonks.forEach(x => {
        if (x.ticker.startsWith(userInput)) exactMatches.push({ name: formatName(x), value: x.ticker });
        else if (x.ticker.includes(userInput)) closeMatches.push({ name: formatName(x), value: x.ticker });
    })

    return int.respond(exactMatches.concat(closeMatches).slice(0, 25))
}

export default autocompleteStock;