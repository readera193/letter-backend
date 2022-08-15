const Game = require("../libs/Game");


const join = "/game/join";

module.exports = (app) => {
    /**
     * @swagger
     * /game/join:
     *   post:
     *     description: Join game
     *     tags:
     *       - Game
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: playerName
     *         in: body
     *         required: true
     *         schema:
     *           type: object
     *           properties:
     *             playerName:
     *               type: string
     *               example: reader
     *           required:
     *             - playerName
     *     responses:
     *       200:
     *         description: Letter backend works fine.
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

