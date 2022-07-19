const Game = module.exports = {
    state: "join",
    playerNames: [],
    actionPlayer: "",

    join(playerName) {
        if (Game.playerNames.length >= 4) {
            return { state: "error", msg: "房間已滿" };
        } else if (Game.playerNames.includes(playerName)) {
            return { state: "error", msg: "重複暱稱" };
        } else {
            Game.playerNames.push(playerName);
            if (Game.playerNames.length === 1) {
                return { state: "room", btns: ["start"] };
            } else {
                return { state: "room", btns: [] };
            }
        }
    },

    exit(playerName) {
        Game.playerNames = Game.playerNames.filter((name) => name !== playerName);
    },

    reset() {
        Energy.playerNames = [];
    },
}