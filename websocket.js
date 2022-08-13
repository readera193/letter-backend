const { Server } = require("ws");
const Game = require("./Game");
const { cardText } = require("./configs/config");


module.exports = (server) => {
    const wsServer = new Server({ server });

    const broadcast = (data) => {
        let dataString = JSON.stringify(data);
        wsServer.clients.forEach((client) => {
            if (client.playerName) {
                client.send(dataString);
            }
        });
    };

    const update = () => {
        let data = Game.publicData();
        console.log("update:\n", JSON.parse(JSON.stringify(Game)));
        wsServer.clients.forEach((client) => {
            if (client.playerName) {
                console.log(client.playerName, Game.playerState[client.playerName]);
                data.cards = [Game.playerState[client.playerName].card];
                client.send(JSON.stringify(data));
            }
        });
    };

    wsServer.on("connection", (ws) => {
        ws.on("message", (data) => {
            try {
                let { action, playerName, playedCard, selectedPlayer, guessCard } = JSON.parse(data);

                console.log(new Date().toLocaleString("zh-TW", { "hour12": false }),
                    ws.playerName || playerName, "send", JSON.parse(data));

                if (action === "join") {
                    ws.playerName = playerName;
                    Game.join(playerName);
                    update();
                } else if (action === "start") {
                    Game.start();
                    update();
                    broadcast({ type: "start", });
                } else if (action === "draw") {
                    ws.send(JSON.stringify({
                        type: "deal",
                        cards: [Game.deal(), Game.playerState[ws.playerName].card],
                    }));
                } else if (action === "play") {
                    Game.play(ws.playerName, playedCard, selectedPlayer, guessCard);
                    update();
                    if (playedCard === 2) {
                        let card = cardText[Game.playerState[selectedPlayer].card];
                        ws.send(JSON.stringify({
                            type: "baron",
                            msg: `${selectedPlayer} 的手牌是 ${card}`,
                        }));
                    }
                } else {
                    throw "unknown action: " + action;
                }
            } catch (error) {
                console.log("Error:", error);
                broadcast({ type: "error", msg: error.toString(), });
            }
        });

        ws.on("close", () => {
            Game.eliminate(ws.playerName);
            Game.msg = ws.playerName + " 離開房間";
            update();
            Game.playerNames = Game.playerNames.filter((name) => name !== ws.playerName);
            console.log(ws.playerName, "離開房間");
        });
    });
};

