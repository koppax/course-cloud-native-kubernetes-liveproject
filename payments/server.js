const bodyParser = require("body-parser")
const express = require("express")

const config = require("./config")()

const app = express();

app.use(bodyParser.json());

const loadRepositories = require("./repositories")
const loadControllers = require("./controllers")

const repositories = loadRepositories(config)
loadControllers(app, repositories)

const server_port = config.server_port
app.listen(server_port, () => {
    console.log(`Server is running on port ${server_port}.`)
})
