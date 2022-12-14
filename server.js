const express = require("express");
const app = express();
const listenWebsocket = require("./websocket");
const Game = require("./libs/Game");
const { now } = require("./libs/commonFunctions");
const PORT = process.env.PORT || 1956;


// Middleware
app.use(express.json());
app.use("/swagger", require("./router/swagger"));

// Router
require("./router/game")(app);

const server = app.listen(PORT, () => console.log(now(), `\nListening on ${PORT}`));
const wsServer = listenWebsocket(server);

/**
 *  @swagger
 *  /:
 *    get:
 *      description: Check backend alive
 *      tags:
 *        - root
 *      produces:
 *        - application/json
 *      responses:
 *        200:
 *          description: Letter backend works fine.
 */
app.get("/", (req, res) => res.send("Letter backend works fine."));


/**
 *  @swagger
 *  /reset:
 *    post:
 *      description: Close all ws connection and reset game
 *      tags:
 *        - root
 *      produces:
 *        - application/json
 *      responses:
 *        200:
 *          description: wsServer.clients.size and Game
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  wsServer.clients.size:
 *                    type: integer
 *                  Game:
 *                    $ref: "#/definitions/game"
 *              example:
 *                wsServer.clients.size: 0
 *                Game: {
 *                    state: waiting,
 *                    usedCards: [0, 0, 0, 0, 0, 0, 0, 0, 0],
 *                    cardPool: [],
 *                    playerNames: [],
 *                    actionSequence: [],
 *                    actionPlayer: "",
 *                    publicState: {},
 *                    privateState: {},
 *                    dealedCard: 0,
 *                    publicMsgs: [],
 *                    removeCards: []
 *                }
 *        500:
 *          description: backend exception
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
 */

