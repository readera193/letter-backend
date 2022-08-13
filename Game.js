const { cardText } = require("./configs/config");
const { fisherYatesShuffle } = require("./libs/commonFunctions");


const Game = module.exports = {
    state: "waiting",
    usedCards: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    cardPool: [],           // [1, 1, 1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8],
    playerNames: [],        // ["Reader", .....]    (for show on app)
    actionSequence: [],     // ["Reader", .....]    (save alive player and their action sequence)
    actionPlayer: "",       // and also used for winner
    playerState: {},        // "Reader": { card: [1-8], shield: [true/false], eliminated: [true/false] }, .....
    dealedCard: 0,
    msg: undefined,

    join(playerName) {
        if (Game.state !== "waiting") {
            return { status: 423, msg: "遊戲已開始，請稍等" };
        } else if (Game.playerNames.length >= 4) {
            return { status: 423, msg: "房間已滿" };
        } else if (Game.playerNames.includes(playerName)) {
            return { status: 401, msg: "暱稱已被使用，請輸入其他暱稱" };
        } else {
            Game.playerNames.push(playerName);
            Game.playerState[playerName] = { card: 0, shield: false, eliminated: false };
            Game.msg = playerName + " 進入房間";
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
        Game.msg = undefined;
        Game.playerNames.forEach((playerName) => {
            Game.playerState[playerName] = { card: Game.cardPool.shift(), shield: false, eliminated: false };
        });
    },

    deal() {
        Game.dealedCard = Game.cardPool.shift();
        return Game.dealedCard;
    },

    publicData() {
        let data = JSON.parse(JSON.stringify(Game));

        data.type = "update";
        data.cardPoolRemaining = data.cardPool.length;
        Object.keys(data.playerState).forEach((name) => delete data.playerState[name].card);
        delete data.cardPool;
        delete data.dealedCard;

        return data;
    },

    play(player, playedCard, selectedPlayer, guessCard) {
        console.log(player, "played:", playedCard, selectedPlayer, guessCard);

        Game.usedCards[playedCard] += 1;
        if (playedCard !== Game.dealedCard) {
            Game.playerState[player].card = Game.dealedCard;
        }

        if (selectedPlayer && Game.playerState[selectedPlayer].shield) {
            Game.msg = `${player} 對  ${selectedPlayer} 使用 ${cardText[playedCard]}，但是被侍女攔下了`;
        } else {
            switch (playedCard) {
                case 1:
                    Game.msg = `${player} 使用衛兵，猜測 ${selectedPlayer} 的手牌是 ${cardText[guessCard]}...\n`;
                    if (Game.playerState[selectedPlayer].card === guessCard) {
                        Game.msg += "猜測正確\n";
                        Game.eliminate(selectedPlayer);
                    } else {
                        Game.msg += "猜測錯誤\n";
                    }
                    break;
                case 2:
                    Game.msg = `${player} 對 ${selectedPlayer} 使用神父`;
                    break;
                case 3:
                    let result = "";
                    let playerCard = Game.playerState[player].card;
                    let selectedPlayerCard = Game.playerState[selectedPlayer].card;

                    Game.msg = `${player} 對 ${selectedPlayer} 使用男爵，`;
                    if (playerCard > selectedPlayerCard) {
                        Game.msg += `\n${selectedPlayer} 的卡片為 ${selectedPlayerCard + " - " + cardText[selectedPlayerCard]}`;
                        Game.eliminate(selectedPlayer);
                    } else if (playerCard < selectedPlayerCard) {
                        Game.msg += `\n${player} 的卡片為 ${playerCard + " - " + cardText[playerCard]}`;
                        Game.eliminate(player);
                    } else {
                        Game.msg += "雙方平手，無事發生";
                    }
                    break;
                case 4:
                    Game.msg = `${player} 使用侍女`;
                    Game.playerState[player].shield = true;
                    break;
                case 5:
                    Game.msg = `${player} 對 ${selectedPlayer} 使用王子，`;
                    if (Game.playerState[selectedPlayer].card === 8) {
                        Game.msg += `${selectedPlayer} 棄掉了公主，`
                        Game.eliminate(selectedPlayer);
                    } else {
                        Game.msg += `${selectedPlayer} 棄掉手牌重抽`;
                        Game.usedCards[Game.playerState[selectedPlayer].card] += 1;
                        Game.playerState[selectedPlayer].card = Game.cardPool.shift();
                    }
                    break;
                case 6:
                    Game.msg = `${player} 使用國王，與 ${selectedPlayer} 交換手牌`;
                    [Game.playerState[player].card, Game.playerState[selectedPlayer].card] =
                        [Game.playerState[selectedPlayer].card, Game.playerState[player].card];
                    break;
                case 7:
                    Game.msg = `${player} 棄掉了皇后(伯爵夫人)`;
                    break;
                case 8:
                    Game.msg = `${player} 棄掉了公主，`;
                    Game.eliminate(player);
                    break;
                default:
                    throw "Unknown card: " + playedCard;
            }
        }

        Game.setNextActionPlayer();

        if (Game.state === "inGame" && Game.cardPool.length === 0) {
            // find winner and set to actionPlayer
            let maxCard = 0, winners = [];
            let alivePlayers = [Game.actionPlayer, ...Game.actionSequence];

            Game.actionPlayer = "";
            Game.msg += "\n本輪結束";

            alivePlayers.forEach((name) => {
                let curCard = Game.playerState[name].card;
                Game.msg += `\n${name} 的手牌為：${cardText[curCard]}`;

                if (curCard > maxCard) {
                    maxCard = curCard;
                    winners = [name];
                } else if (curCard === maxCard) {
                    winners.push(name);
                }
            });

            if (alivePlayers.length === winners.length) {
                Game.msg += "\n本局平手，無人獲勝";
            } else {
                Game.winner(winners.join("、"));
            }
        }
    },

    setNextActionPlayer() {
        Game.actionSequence.push(Game.actionPlayer);
        Game.actionPlayer = Game.actionSequence.shift();
        Game.playerState[Game.actionPlayer].shield = false;
    },

    eliminate(playerName) {
        console.log("Eliminate", playerName);
        Game.msg += `${playerName} 出局`;
        Game.playerState[playerName].eliminated = true;

        if (Game.actionPlayer === playerName) {
            // pop last player from actionSequence, setNextActionPlayer will push later
            // just like last player played a card
            Game.actionPlayer = Game.actionSequence.pop();
        } else {
            Game.actionSequence = Game.actionSequence.filter((name) => name !== playerName);
        }

        if (Game.actionSequence.length === 0) {
            Game.winner(Game.actionPlayer);
        }
    },

    winner(winner) {
        Game.state = "waiting";
        Game.msg += `\n恭喜 ${winner} 本輪獲勝`;
    },
};

