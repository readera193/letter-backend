const { Server } = require("ws");
const Game = require("./Game");


module.exports = (server) => {
    const wsServer = new Server({ server });

    const update = () => {
        let data = Game.updateData();
        wsServer.clients.forEach((client) => {
            client.send(data);
        });
    };

    wsServer.on("connection", (ws) => {
        ws.on("message", (data) => {
            try {
                let { action, playerName } = JSON.parse(data);

                console.log(new Date().toLocaleString("zh-TW", { "hour12": false }),
                    ws.playerName || playerName, "send", JSON.parse(data));

                if (action === "join") {
                    console.log(playerName, "joined game");
                    ws.playerName = playerName;
                    update();
                } else if (action === "start") {
                    Game.start();
                    let card = Game.deal();
                    update();
                    console.log(Game, card);
                } else if ([1, 2, 3, 4, 5, 6, 7, 8].includes(action)) {
                } else {
                    console.log("unknown action:", action);
                }
            } catch (error) {
                console.log("error:", error);
                wsServer.clients.forEach((client) => {
                    console.log("client:", client.playerName);
                    client.send(JSON.stringify({
                        type: "error",
                        msg: error,
                    }));
                });
            }
        });

        ws.on("close", () => {
            Game.gameover(ws.playerName);
            delete Game.playerState[ws.playerName];
            update();
            console.log(ws.playerName, "closed connection");
        });
    });
};

