interface GameState {
    isMarketOpen: boolean;
    marketState: "pre" | "open" | "after" | "closed";
}

export default GameState;