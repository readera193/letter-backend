const { Server } = require("ws");
const url = require("url");
const { cardText } = require("./configs/config");
const { now } = require("./libs/commonFunctions");
const Game = require("./Game");


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
                data.cards = [Game.playerState[client.playerName].card];
                client.send(JSON.stringify(data));
            }
        });
    };

    wsServer.on("connection", (ws, req) => {
        const { playerName } = url.parse(req.url, true).query;
        ws.playerName = playerName;
        update();

        ws.on("message", (data) => {
            console.log(now(), ws.playerName, "send", JSON.parse(data));

            try {
                let { action, playedCard, selectedPlayer, guessCard } = JSON.parse(data);

                if (action === "start") {
                    Game.start();
                    update();
                    broadcast({ type: "start" });
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
                broadcast({ type: "error", msg: error.toString() });
            }
        });

        ws.on("close", () => {
            console.log(ws.playerName, "離開房間");
            Game.eliminate(ws.playerName);
            Game.msg = ws.playerName + " 離開房間";
            Game.playerNames = Game.playerNames.filter((name) => name !== ws.playerName);
            update();
        });
    });
};

