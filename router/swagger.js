const express = require("express");
const router = express.Router();

const options = {
    swaggerDefinition: {
        openapi: "3.0.0",
        info: {
            title: "Letter API - Swagger",
            version: "1.0.0",
            description: "Letter API with Swagger doc",
        },
        servers: [
            {
                url: "http://localhost:1956",
                description: "for testing localhost",
            },
            {
                url: "https://letter-backend.herokuapp.com",
                description: "for testing backend on heroku",
            },
        ],
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

