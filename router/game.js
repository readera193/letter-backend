const Game = require("../libs/Game");

const state = "/game/state";
const join = "/game/join";

module.exports = (app) => {
    /**
     *  @swagger
     *  /game/state:
     *    get:
     *      description: game state
     *      tags:
     *        - Game
     *      produces:
     *        - application/json
     *      responses:
     *        200:
     *          description: Game state
     *          content:
     *            application/json:
     *              schema:
     *                $ref: "#/definitions/game"
     *              example:
     *                state: inGame
     *                usedCards: [0, 1, 2, 1, 1, 1, 0, 1, 0]
     *                cardPool: [5, 3, 8, 4]
     *                playerNames: [reader, juliet]
     *                actionSequence: [juliet]
     *                actionPlayer: reader
     *                publicState: {
     *                    reader: { shield: false, eliminated: false },
     *                    juliet: { shield: true, eliminated: false }
     *                }
     *                privateState: {
     *                    reader: { card: 6, msg: "" },
     *                    juliet: { card: 1, msg: "" }
     *                }
     *                dealedCard: 4
     *                publicMsgs: []
     *                removeCards: [1, 1, 1]
     *        500:
     *          description: backend exception
     */
    app.get(state, (req, res) => {
        try {
            res.json(Game);
        }
        catch (e) {
            res.status(500);
            res.send(e.toString());
        }
    });


    /**
     *  @swagger
     *  /game/join:
     *    post:
     *      description: Join game
     *      tags:
     *        - Game
     *      produces:
     *        - application/json
     *      parameters:
     *        - in: body
     *          name: playerName
     *          required: true
     *          schema:
     *            type: object
     *            properties:
     *              playerName:
     *                type: string
     *                example: reader
     *            required:
     *              - playerName
     *      responses:
     *        200:
     *          description: 成功
     *        401:
     *          description: 暱稱已被使用，請輸入其他暱稱
     *        423:
     *          description: 遊戲已開始，請稍等/房間已滿
     *        500:
     *          description: backend exception
     */
    app.post(join, (req, res) => {
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
};

