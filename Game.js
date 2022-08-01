const fisherYatesShuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

const Game = module.exports = {
    state: "waiting",
    usedCards: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    cardPool: [1, 1, 1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8],
    actionQueue: [],
    actionPlayer: "",
    playerState: {
        "Irena": { card: 0, shield: false, gameover: false, action: false },
        // "Juliet": { card: 0, shield: false, gameover: false, action: false },
        // "Reader": { card: 0, shield: false, gameover: false, action: false },
    },

    join(playerName) {
        let playerNames = Object.keys(Game.playerState);
        if (Game.state !== "waiting") {
            return { status: 423, msg: "遊戲已開始，請稍等" };
        } else if (playerNames.length >= 4) {
            return { status: 423, msg: "房間已滿" };
        } else if (playerNames.includes(playerName)) {
            return { status: 401, msg: "暱稱已被使用，請輸入其他暱稱" };
        } else {
            Game.playerState[playerName] = { card: 0, shield: false, gameover: false, action: false };
            return { status: 200, msg: "成功" };
        }
    },

    start() {
        let playerNames = Object.keys(Game.playerState);
        if (playerNames.length < 2) {
            throw "需要 2 ~ 4 位玩家";
        }
        Game.usedCards = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        Game.cardPool = fisherYatesShuffle([1, 1, 1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8]);
        Game.playerCards = {};
        Game.actionQueue = playerNames;

        playerNames.forEach((playerName) => {
            Game.playerState[playerName] = Game.cardPool.shift();
        });
    },

    deal() {
        Game.actionPlayer = Game.actionQueue.shift();
        return Game.cardPool.shift();
    },

    updateData() {
        let data = JSON.parse(JSON.stringify(Game));

        for (let key of Object.keys(data.playerState)) {
            delete data.playerState[key].card;
        }
        delete data.cardPool;
        data.type = "update";

        return JSON.stringify(data);
    },

    action() {

    },

    gameover(playerName) {
        console.log("gameover", playerName);
        Game.playerState[playerName].gameover = true;
        Game.actionQueue = Game.actionQueue.filter((name) => name !== playerName);
        // next player if someone exit at his round
    },
}