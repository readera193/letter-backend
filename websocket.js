const { Server } = require("ws");
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
        wsServer.clients.forEach((client) => {
            if (client.playerName) {
                data.cards = [Game.playerState[client.playerName].card];
                client.send(JSON.stringify(data));
            }
        });
    };

    wsServer.on("connection", (ws) => {
        ws.on("message", (data) => {
            try {
                let { action, playerName, playedCard } = JSON.parse(data);

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
                    ws.send(JSON.stringify({ type: "deal", cards: [Game.deal(), Game.playerState[ws.playerName].card] }));
                } else if (action === "play") {
                    Game.play(ws.playerName, playedCard);
                    update();
                    console.log("play result:\n", JSON.parse(JSON.stringify(Game)));
                } else {
                    throw "unknown action: " + action;
                }
            } catch (error) {
                console.log("Error:", error);
                broadcast({ type: "error", msg: error.toString(), });
            }
        });

        ws.on("close", () => {
            Game.playerNames = Game.playerNames.filter((name) => name !== ws.playerName);
            Game.eliminate(ws.playerName);
            Game.msg = ws.playerName + " 離開房間";
            update();
            console.log(ws.playerName, "closed connection");
        });
    });
};

