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
    playerNames: [],        // ["Reader", .....]    (for show on app)
    actionSequence: [],     // ["Reader", .....]    (save alive player and their action sequence)
    actionPlayer: "",       // and also used for winner
    playerState: {},        // "Reader": { card: [1-8], shield: [true/false], eliminated: [true/false] }, .....

    join(playerName) {
        if (Game.state !== "waiting") {
            return { status: 423, msg: "遊戲已開始，請稍等" };
        } else if (Game.playerNames.length >= 4) {
            return { status: 423, msg: "房間已滿" };
        } else if (Game.playerNames.includes(playerName)) {
            return { status: 401, msg: "暱稱已被使用，請輸入其他暱稱" };
        } else {
            Game.playerNames.push(playerName);
            console.log(playerName, "joined game");
            return { status: 200, msg: "成功" };
        }
    },

    start() {
        if (Game.playerNames.length < 2) {
            throw "需要 2 ~ 4 位玩家";
        }

        Game.state = "inGame";
        Game.usedCards = [0, 0, 0, 0, 0, 0, 0, 0, 0];   // skip index 0 to make index 1 for card 1
        Game.cardPool = fisherYatesShuffle([1, 1, 1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8]);
        Game.playerNames = fisherYatesShuffle(Game.playerNames);
        Game.actionSequence = [...Game.playerNames];
        Game.actionPlayer = Game.actionSequence.shift();

        Game.playerNames.forEach((playerName) => {
            Game.playerState[playerName] = { card: Game.cardPool.shift(), shield: false, eliminated: false };
        });
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

    play(player, playedCard, choosedPlayer) {
        console.log(player, "played:", playedCard, choosedPlayer);

        Game.usedCards[playedCard] += 1;
        if (playedCard !== Game.dealedCard) {
            Game.playerState[Game.actionPlayer].card = Game.dealedCard;
        }

        switch (playedCard) {
            case 1:
                // if (state[choosedPlayer].card === guess) {
                //     console.log(`${player} guess ${choosedPlayer}'s card is ${guess}, result: correct`);
                //     eliminate(choosedPlayer);
                // } else {
                //     console.log(`${player} guess ${choosedPlayer}'s card is ${guess}, result: wrong`);
                // }
                break;
            case 2:
                // // show choosedPlayer's card to player
                // console.log(`show ${choosedPlayer}'s card: ${state[choosedPlayer].card}`);
                break;
            case 3:
                // if (state[player].card > state[choosedPlayer].card) {
                //     eliminate(choosedPlayer);
                // } else if (state[player].card < state[choosedPlayer].card) {
                //     eliminate(player);
                // } else {
                //     // nothing happened
                //     console.log("Duel is draw");
                // }
                break;
            case 4:
                Game.playerState[player].shield = true;
                break;
            case 5:
                // if (state[choosedPlayer].card === 8) {
                //     eliminate(choosedPlayer);
                // } else {
                //     state.usedCards[state[choosedPlayer].card] += 1;
                //     state[choosedPlayer].card = cardPool.shift()
                // }
                break;
            case 6:
                // [state[player].card, state[choosedPlayer].card] = [state[choosedPlayer].card, state[player].card];
                break;
            case 7:
                console.log("Maybe player's card is 5.....maybe");
                break;
            case 8:
                Game.eliminate(player);
                break;
            default:
                throw "Unknown card: " + playedCard;
        }

        Game.setNextActionPlayer();

        if (Game.cardPool.length === 0) {
            Game.state = "gameOver";
            Game.actionPlayer = [Game.actionPlayer, ...Game.actionSequence].reduce((winner, curPlayer) =>
                Game.playerState[winner].card > Game.playerState[curPlayer].card ? winner : curPlayer
            );
            console.log("Winner appears:", Game.actionPlayer);
        }
    },

    setNextActionPlayer() {
        Game.actionSequence.push(Game.actionPlayer);
        Game.actionPlayer = Game.actionSequence.shift();
        Game.playerState[Game.actionPlayer].shield = false;
    },

    eliminate(playerName) {
        console.log("Eliminate", playerName);

        Game.playerState[playerName].eliminated = true;

        if (Game.actionPlayer === playerName) {
            // pop last player from actionSequence, setNextActionPlayer will push later
            // just like last player played a card
            Game.actionPlayer = Game.actionSequence.pop();
        } else {
            Game.actionSequence = Game.actionSequence.filter((name) => name !== playerName);
        }

        if (Game.actionSequence.length === 0) {
            Game.state = "gameOver";
            console.log("Winner appears:", Game.actionPlayer);
        }
    },
}