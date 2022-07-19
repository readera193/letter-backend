const WebSocketServer = require("ws").Server;
const Game = require("./Game");


module.exports = (WS_PORT) => {
    const wsServer = new WebSocketServer({ port: WS_PORT });

    wsServer.on("connection", (ws) => {
        ws.on("message", (data) => {
            let { action, playerName } = JSON.parse(data);

            if (action === "join") {
                ws.playerName = playerName;
                let result = Game.join(playerName);
                ws.send(JSON.stringify(result));
                if (result.state === "error") {
                    ws.close();
                } else {
                    console.log(playerName, "joined game", Game.playerNames);
                    wsServer.clients.forEach((client) => {
                        if (client.playerName !== playerName) {
                            client.send(JSON.stringify({
                                state: "join",
                                playerNames: Game.playerNames,
                            }));
                        }
                    })
                }
            }
        });

        ws.on("close", () => {
            Game.exit(ws.playerName);
            console.log(ws.playerName, "closed connection");


        });
    });
};

