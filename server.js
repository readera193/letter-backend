const express = require("express");
const listenWebsocket = require("./websocket");
const PORT = process.env.PORT || 1956;

const app = express();

app.get("/", (req, res) => {
    res.send("Letter backend works fine.");
});

const server = app.listen(PORT, () => {
    console.log(new Date().toLocaleString("zh-TW", { "hour12": false }));
    console.log(`Listening on ${PORT}`);
});

listenWebsocket(server);

