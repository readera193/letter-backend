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
    cardPool: [],           // [1, 1, 1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8],
    actionSequence: [],     // ["Reader", .....]
    actionPlayer: "",
    playerState: {},        // "Reader": { card: 0, shield: false, gameover: false, action: false }, .....
    dealedCard: 0,

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
            Game.actionSequence.push(playerName);

            console.log(playerName, "joined game");
            return { status: 200, msg: "成功" };
        }
    },

    start() {
        let playerNames = Object.keys(Game.playerState);

        if (playerNames.length < 2) {
            throw "需要 2 ~ 4 位玩家";
        }

        Game.state = "inGame";
        Game.usedCards = [0, 0, 0, 0, 0, 0, 0, 0, 0];   // skip index 0 to make index 1 for card 1
        Game.cardPool = fisherYatesShuffle([1, 1, 1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8]);
        Game.actionSequence = fisherYatesShuffle(playerNames);
        Game.actionPlayer = Game.actionSequence[0];

        // for test
        Game.cardPool = fisherYatesShuffle([4, 4, 7, 7]);

        playerNames.forEach((playerName) => {
            Game.playerState[playerName] = {
                card: Game.cardPool.shift(),
                shield: false,
                gameover: false,
                action: false,
            };
        });
        Game.playerState[Game.actionPlayer].action = true;
    },

    deal() {
        Game.dealedCard = Game.cardPool.shift();
        return Game.dealedCard;
    },

    updateData() {
        let data = JSON.parse(JSON.stringify(Game));

        for (let key of Object.keys(data.playerState)) {
            delete data.playerState[key].card;
        }
        delete data.cardPool;
        data.type = "update";

        return data;
    },

    action(player, playedCard, choosedPlayer) {
        console.log("action:", player, playedCard, choosedPlayer);
        switch (playedCard) {
            // case 1:
            //     if (state[choosedPlayer].card === guess) {
            //         console.log(`${player} guess ${choosedPlayer}'s card is ${guess}, result: correct`);
            //         gameOver(choosedPlayer);
            //     } else {
            //         console.log(`${player} guess ${choosedPlayer}'s card is ${guess}, result: wrong`);
            //     }
            //     break;
            // case 2:
            //     // show choosedPlayer's card to player
            //     console.log(`show ${choosedPlayer}'s card: ${state[choosedPlayer].card}`);
            //     break;
            // case 3:
            //     if (state[player].card > state[choosedPlayer].card) {
            //         gameOver(choosedPlayer);
            //     } else if (state[player].card < state[choosedPlayer].card) {
            //         gameOver(player);
            //     } else {
            //         // nothing happened
            //         console.log("Duel is draw");
            //     }
            //     break;
            case 4:
                Game.playerState[player].shield = true;
                break;
            // case 5:
            //     if (state[choosedPlayer].card === 8) {
            //         gameOver(choosedPlayer);
            //     } else {
            //         state.usedCards[state[choosedPlayer].card] += 1;
            //         state[choosedPlayer].card = cardPool.shift()
            //     }
            //     break;
            // case 6:
            //     [state[player].card, state[choosedPlayer].card] = [state[choosedPlayer].card, state[player].card];
            //     break;
            case 7:
                console.log("maybe player's card is 5.....maybe");
                break;
            case 8:
                Game.gameover(player);
                break;
            default:
                throw "unknown card: " + playedCard;
        }


        Game.usedCards[playedCard] += 1;
        if (playedCard !== Game.dealedCard) {
            Game.playerState[Game.actionPlayer].card = Game.dealedCard;
        }
        Game.playerState[Game.actionPlayer].action = false;

        // set next actionPlayer
        Game.actionPlayer = Game.actionSequence[(Game.actionSequence.indexOf(Game.actionPlayer) + 1) % Game.actionSequence.length];
        Game.playerState[Game.actionPlayer].action = true;
        Game.playerState[Game.actionPlayer].shield = false;
    },

    gameover(playerName) {
        console.log("gameover", playerName);
        Game.playerState[playerName].gameover = true;
        Game.actionSequence = Game.actionSequence.filter((name) => name !== playerName);
        // next player if someone exit at his round
    },
}