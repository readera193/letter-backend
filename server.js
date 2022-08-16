const express = require("express");
const listenWebsocket = require("./websocket");
const PORT = process.env.PORT || 1956;

const Game = require("./libs/Game");
const { now } = require("./libs/commonFunctions");


const app = express();

const swaggerRoute = require("./router/swagger");

app.use(express.json());
app.use("/swagger", swaggerRoute);

require("./router/game")(app);

const server = app.listen(PORT, () => console.log(now(), `\nListening on ${PORT}`));
const wsServer = listenWebsocket(server);

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
app.get("/", (req, res) => res.send("Letter backend works fine."));


/**
 * @swagger
 * /reset:
 *   post:
 *     description: Close all ws connection and reset game
 *     tags:
 *       - root
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: wsServer.clients.size and Game
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 wsServer.clients.size:
 *                   type: integer
 *                   example: 0
 *                 game:
 *                   $ref: "#/definitions/game"
 * 
 *       500:
 *         description: backend exception
 */
app.post("/reset", (req, res) => {
    try {
        wsServer.clients.forEach((client) => client.close());
        Game.reset();
        res.json({
            "wsServer.clients.size": wsServer.clients.size,
            "Game": Game,
        });
    }
    catch (e) {
        res.status(500);
        res.send(e.toString());
    }
});


/**
 * @swagger
 * definitions:
 *  game:
 *    type: object
 *    properties:
 *     state:
 *       type: string
 *     usedCards:
 *       type: array
 *       items:
 *         type: integer
 *     cardPool:
 *       type: array
 *       items:
 *         type: integer
 *     playerNames:
 *       type: array
 *       items:
 *         type: string
 *     actionSequence:
 *       type: array
 *       items:
 *         type: string
 *     actionPlayer:
 *       type: string
 *     publicState:
 *       type: object
 *       properties:
 *         shield:
 *           type: boolean
 *         eliminated:
 *           type: boolean
 *     privateState:
 *       type: object
 *       properties:
 *         card:
 *           type: integer
 *         msg:
 *           type: string
 *     dealedCard:
 *       type: integer
 *     publicMsgs:
 *       type: array
 *       items:
 *         type: string
 *     removeCards:
 *       type: array
 *       items:
 *         type: integer
 *    example:
 *      state: inGame
 *      usedCards: [0, 1, 2, 1, 1, 1, 0, 1, 0]
 *      cardPool: [5, 3, 8, 4]
 *      playerNames: [reader, juliet]
 *      actionSequence: [juliet]
 *      actionPlayer: reader
 *      publicState: {
 *          reader: { shield: false, eliminated: false },
 *          juliet: { shield: true, eliminated: false }
 *      }
 *      privateState: {
 *          reader: { card: 6, msg: "" },
 *          juliet: { card: 1, msg: "" }
 *      }
 *      dealedCard: 4
 *      publicMsgs: []
 *      removeCards: [1, 1, 1]
 */

