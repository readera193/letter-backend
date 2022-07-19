const express = require("express");
const listenWebsocket = require("./websocket");
const PORT = process.env.PORT || 80;
const WS_PORT = process.env.WS_PORT || 1956;


const app = express();

app.get("/", (req, res) => {
    res.send("Letter backend works fine.");
});

app.listen(PORT, () => {
    console.log(new Date().toLocaleString("zh-TW", { "hour12": false }));
    console.log(`Listening on ${PORT}`);
});

listenWebsocket(WS_PORT);

