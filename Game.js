const fisherYatesShuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

const Game = module.exports = {
    state: "join",
    usedCards: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    cardPool: [1, 1, 1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8],
    playerNames: ["Reader", "Juliet"],
    // playerNames: [],
    actionPlayer: "",
    shields: ["Reader"],
    playerCards: {},

    join(playerName) {
        if (Game.playerNames.length >= 4) {
            return { status: 423, msg: "房間已滿" };
        } else if (Game.playerNames.includes(playerName)) {
            return { status: 401, msg: "暱稱已被使用，請輸入其他暱稱" };
        } else {
            Game.playerNames.push(playerName);
            return { status: 200, msg: "成功" };
        }
    },

    start() {
        Game.usedCards = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        Game.cardPool = fisherYatesShuffle([1, 1, 1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8]);
        Game.playerCards = {};

        Game.cardPool.splice(0, Game.playerNames.length).forEach((card, index) => {
            Game.playerCards[Game.playerNames[index]] = card;
        });
        // Game.actionPlayer = Game.playerNames.shift();
    },

    deal() {
        return Game.cardPool.shift();
    },

    gameState() {
        return JSON.stringify({
            usedCards: Game.usedCards,
            shields: Game.shields,
            actionPlayer: Game.actionPlayer,
        });
    },

    action() {

    },

    exit(playerName) {
        Game.playerNames = Game.playerNames.filter((name) => name !== playerName);
        Game.shields = Game.shields.filter((name) => name !== playerName);
        // next player if someone exit at its round
    },
}