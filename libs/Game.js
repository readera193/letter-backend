const { cardText } = require("../configs/config");
const { fisherYatesShuffle } = require("./commonFunctions");


const Game = module.exports = {
    state: "waiting",
    usedCards: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    cardPool: [],           // [1, 1, 1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8],
    playerNames: [],        // ["Reader", .....]    (for show on app)
    actionSequence: [],     // ["Reader", .....]    (save alive player and their action sequence)
    actionPlayer: "",       // and also used for winner
    publicState: {},        // "Reader": { shield: [true/false], eliminated: [true/false] }, .....
    privateState: {},       // "Reader": { card: [1-8], msg: [] }, .....
    dealedCard: 0,
    publicMsgs: [],
    removeCards: [],

    join(playerName) {
        if (Game.state !== "waiting") {
            return { status: 423, msg: "遊戲已開始，請稍等" };
        } else if (Game.playerNames.length >= 4) {
            return { status: 423, msg: "房間已滿" };
        } else if (Game.playerNames.includes(playerName)) {
            return { status: 401, msg: "暱稱已被使用，請輸入其他暱稱" };
        } else {
            Game.playerNames.push(playerName);
            Game.publicState[playerName] = { shield: false, eliminated: false };
            Game.privateState[playerName] = { card: 0, msg: [] };
            Game.publicMsgs.push(playerName + " 進入房間");
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
        Game.removeCards = Game.cardPool.splice(0, Game.playerNames.length <= 2 ? 3 : 1);
        Game.playerNames = fisherYatesShuffle(Game.playerNames);
        Game.actionSequence = [...Game.playerNames];
        Game.actionPlayer = Game.actionSequence.shift();
        Game.playerNames.forEach((playerName) => {
            Game.publicState[playerName] = { shield: false, eliminated: false };
            Game.privateState[playerName] = { card: Game.cardPool.shift(), msg: "" };
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
        data.unknownCards = data.removeCards.length;
        delete data.privateState;
        delete data.cardPool;
        delete data.dealedCard;
        delete data.removeCards;
        delete data.publicMsgs;
        delete data.actionSequence;

        return data;
    },

    play(player, playedCard, selectedPlayer, guessCard) {
        console.log(player, "played:", playedCard, selectedPlayer, guessCard);

        Game.usedCards[playedCard] += 1;
        if (playedCard !== Game.dealedCard) {
            Game.privateState[player].card = Game.dealedCard;
        }

        if ([1, 2, 3, 5, 6].includes(playedCard) && selectedPlayer === "") {
            Game.publicMsgs.push(`${player} 使用 ${cardText[playedCard]}，但是所有玩家都有侍女保護，${cardText[playedCard]}沒有效果`);
        } else {
            let playerCard = Game.privateState[player].card;
            let selectedPlayerCard = Game.privateState[selectedPlayer]?.card;
            switch (playedCard) {
                case 1:
                    Game.publicMsgs.push(`${player} 使用衛兵，猜測 ${selectedPlayer} 的手牌是 ${guessCard}-${cardText[guessCard]}...`);
                    if (selectedPlayerCard === guessCard) {
                        Game.publicMsgs.push("猜測正確");
                        Game.eliminate(selectedPlayer);
                    } else {
                        Game.publicMsgs.push("猜測錯誤");
                    }
                    break;
                case 2:
                    Game.publicMsgs.push(`${player} 對 ${selectedPlayer} 使用神父`);
                    Game.privateState[player].msg = "\n(本訊息只有你收到) "
                        + `${selectedPlayer} 的手牌是：${selectedPlayerCard}-${cardText[selectedPlayerCard]}`;
                    break;
                case 3:
                    Game.publicMsgs.push(`${player} 對 ${selectedPlayer} 使用男爵`);
                    // show winner card to loser, and push into removeCard in secret
                    if (playerCard > selectedPlayerCard) {
                        Game.privateState[selectedPlayer].msg = "\n(本訊息只有你收到)："
                            + `${player} 的手牌是：${playerCard}-${cardText[playerCard]}`;
                        Game.removeCards.push(playerCard);
                        Game.eliminate(selectedPlayer);
                    } else if (playerCard < selectedPlayerCard) {
                        Game.privateState[player].msg = "\n(本訊息只有你收到)："
                            + `${selectedPlayer} 的手牌是：${selectedPlayerCard}-${cardText[selectedPlayerCard]}`;
                        Game.removeCards.push(selectedPlayerCard);
                        Game.eliminate(player);
                    } else {
                        Game.publicMsgs.push("雙方平手，無事發生");
                    }
                    break;
                case 4:
                    Game.publicMsgs.push(`${player} 使用侍女`);
                    Game.publicState[player].shield = true;
                    break;
                case 5:
                    Game.publicMsgs.push(`${player} 對 ${selectedPlayer} 使用王子`);
                    if (selectedPlayerCard === 8) {
                        Game.publicMsgs.push(`${selectedPlayer} 棄掉了公主`);
                        Game.eliminate(selectedPlayer);
                    } else {
                        Game.publicMsgs.push(`${selectedPlayer} 棄掉手牌 ${selectedPlayerCard}-${cardText[selectedPlayerCard]} 重抽`);
                        Game.usedCards[selectedPlayerCard] += 1;
                        if (Game.cardPool.length > 0) {
                            Game.privateState[selectedPlayer].card = Game.cardPool.shift();
                        } else {
                            // A game will only be executed once, because the game will end immediately
                            // so this card must be the one that be removed before the game started
                            Game.privateState[selectedPlayer].card = Game.removeCards.shift();
                        }
                    }
                    break;
                case 6:
                    Game.publicMsgs.push(`${player} 使用國王，與 ${selectedPlayer} 交換手牌`);
                    Game.privateState[player].card = selectedPlayerCard;
                    Game.privateState[selectedPlayer].card = playerCard;
                    break;
                case 7:
                    Game.publicMsgs.push(`${player} 棄掉了皇后(伯爵夫人)`);
                    break;
                case 8:
                    Game.publicMsgs.push(`${player} 棄掉了公主`);
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
            Game.publicMsgs.push("本輪遊戲結束");

            alivePlayers.forEach((name) => {
                let curCard = Game.privateState[name].card;

                Game.publicMsgs.push(`${name} 的手牌是：${cardText[curCard]}`);
                if (curCard > maxCard) {
                    maxCard = curCard;
                    winners = [name];
                } else if (curCard === maxCard) {
                    winners.push(name);
                }
            });

            if (alivePlayers.length === winners.length) {
                Game.publicMsgs.push("本局平手，無人獲勝");
            } else {
                Game.winner(winners.join("、"));
            }
        }
    },

    setNextActionPlayer() {
        Game.actionSequence.push(Game.actionPlayer);
        Game.actionPlayer = Game.actionSequence.shift();
        Game.publicState[Game.actionPlayer].shield = false;
    },

    eliminate(playerName) {
        console.log("Eliminate", playerName);
        Game.publicMsgs.push(`${playerName} 出局`);
        Game.publicState[playerName].eliminated = true;

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
        Game.publicMsgs.push(`恭喜 ${winner} 本輪獲勝`);
    },

    reset() {
        Game.state = "waiting";
        Game.usedCards = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        Game.cardPool = [];
        Game.playerNames = [];
        Game.actionSequence = [];
        Game.actionPlayer = "";
        Game.publicState = {};
        Game.privateState = {};
        Game.dealedCard = 0;
        Game.publicMsgs = [];
        Game.removeCards = [];
    },
};

