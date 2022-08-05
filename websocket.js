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

    wsServer.on("connection", (ws) => {
        ws.on("message", (data) => {
            try {
                let { action, playerName, playedCard } = JSON.parse(data);

                console.log(new Date().toLocaleString("zh-TW", { "hour12": false }),
                    ws.playerName || playerName, "send", JSON.parse(data));

                if (action === "join") {
                    ws.playerName = playerName;
                    Game.join(playerName);
                    broadcast(Game.updateData());
                } else if (action === "start") {
                    Game.start();
                    broadcast(Game.updateData());
                    wsServer.clients.forEach((client) => {
                        if (client.playerName) {
                            client.send(JSON.stringify({
                                type: "deal",
                                cards: [Game.playerState[client.playerName].card],
                            }));
                        }
                    });
                } else if (action === "draw") {
                    ws.send(JSON.stringify({ type: "deal", cards: [Game.deal(), Game.playerState[ws.playerName].card] }));
                } else if (action === "play") {
                    console.log("before", JSON.parse(JSON.stringify(Game)));
                    Game.action(ws.playerName, playedCard);
                    broadcast(Game.updateData());
                    ws.send(JSON.stringify({ type: "deal", cards: [Game.playerState[ws.playerName].card] }));
                    console.log("after", JSON.parse(JSON.stringify(Game)));
                } else {
                    throw "unknown action: " + action;
                }
            } catch (error) {
                console.log("error:", error);
                broadcast({ type: "error", msg: error.toString(), });
            }
        });

        ws.on("close", () => {
            Game.gameover(ws.playerName);
            delete Game.playerState[ws.playerName];
            broadcast(Game.updateData());
            // update();
            console.log(ws.playerName, "closed connection");
        });
    });
};

