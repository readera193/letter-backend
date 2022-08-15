const express = require("express");
const listenWebsocket = require("./websocket");
const Game = require("./libs/Game");
const { now } = require("./libs/commonFunctions");
const PORT = process.env.PORT || 1956;

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Letter backend works fine.");
});

app.post("/join", (req, res) => {
    try {
        let { playerName } = req.body;

        let { status, msg } = Game.join(playerName);
        res.status(status);
        res.send(msg);
    }
    catch (e) {
        res.status(500);
        res.send(e.toString());
    }
});

const server = app.listen(PORT, () => console.log(now(), `\nListening on ${PORT}`));

listenWebsocket(server);

