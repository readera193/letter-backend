const express = require("express");
const router = express.Router();

const options = {
    swaggerDefinition: {
        info: {
            title: "Letter API - Swagger",
            version: "1.0.0",
            description: "Letter API with Swagger doc",
        },
        schemes: ["http"],
        host: "192.168.0.195:1956",
        basePath: "/",
    },
    apis: ["./server.js", "./router/game.js"],
};

const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = swaggerJSDoc(options);

router.get("/json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
});

router.use("/", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

module.exports = router;

