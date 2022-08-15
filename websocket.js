const { Server } = require("ws");
const url = require("url");
const { cardText } = require("./configs/config");
const { now } = require("./libs/commonFunctions");
const Game = require("./libs/Game");


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
        console.log("update:\n", JSON.parse(JSON.stringify(Game)));
        let data = Game.publicData();
        let publicMsg = Game.publicMsgs.join("\n");

        wsServer.clients.forEach((client) => {
            data.cards = [Game.privateState[client.playerName].card];
            data.msg = publicMsg + Game.privateState[client.playerName].msg;
            client.send(JSON.stringify(data));
            Game.privateState[client.playerName].msg = "";
        });

        Game.publicMsgs = [];
    };

    wsServer.on("connection", (ws, req) => {
        // client pings every 25 seconds, decrease pingTimes every time
        // if pingTimes less or eqaul 0, which means 25 * 72 / 60 = 30 minutes
        ws.pingTimes = 72;
        const { playerName } = url.parse(req.url, true).query;
        ws.playerName = playerName;
        update();

        ws.on("message", (data) => {
            if (data.toString().length === 0) {
                // client send a ping
                ws.pingTimes -= 1;
                if (ws.pingTimes <= 0) {
                    ws.close();
                }
                return;
            }

            ws.pingTimes = 72;
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
                        cards: [Game.deal(), Game.privateState[ws.playerName].card],
                        cardPoolRemaining: Game.cardPool.length,
                    }));
                } else if (action === "play") {
                    Game.play(ws.playerName, playedCard, selectedPlayer, guessCard);
                    update();
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
            Game.publicMsgs.push(`${ws.playerName} 離開房間`);
            Game.playerNames = Game.playerNames.filter((name) => name !== ws.playerName);
            update();
        });
    });
};

