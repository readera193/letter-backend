const { Server } = require("ws");
const Game = require("./Game");


module.exports = (server) => {
    const wsServer = new Server({ server });

    wsServer.on("connection", (ws) => {
        ws.on("message", (data) => {
            let { action, playerName } = JSON.parse(data);
            if (action === "join") {
                console.log(playerName, "joined game", Game.playerNames);
                ws.playerName = playerName;
                wsServer.clients.forEach((client) => {
                    client.send(JSON.stringify({
                        state: "join",
                        playerNames: Game.playerNames,
                        // shields: Game.shields,
                    }));
                });
            } else if (action === "start") {
            } else if (action === "getCard") {
            } else if ([1, 2, 3, 4, 5, 6, 7, 8].includes(action)) {
            } else {
                console.log("unknown action:", action);
            }
        });

        ws.on("close", () => {
            Game.exit(ws.playerName);
            wsServer.clients.forEach((client) => {
                client.send(JSON.stringify({
                    state: "exit",
                    actionPlayer: ws.playerName,
                    playerNames: Game.playerNames,
                }));
            });
            console.log(ws.playerName, "closed connection");
        });
    });
};

