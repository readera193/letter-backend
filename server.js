const express = require("express");
const listenWebsocket = require("./websocket");
const { now } = require("./libs/commonFunctions");
const PORT = process.env.PORT || 1956;

const app = express();

const swaggerRoute = require("./router/swagger");

app.use(express.json());
app.use("/swagger", swaggerRoute);

require("./router/game")(app);

/**
 * @swagger
 * /:
 *   get:
 *     description: Check backend alive
 *     tags:
 *       - root
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Letter backend works fine.
 */
app.get("/", (req, res) => {
    res.send("Letter backend works fine.");
});

const server = app.listen(PORT, () => console.log(now(), `\nListening on ${PORT}`));

listenWebsocket(server);

