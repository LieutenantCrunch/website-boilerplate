"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const typeorm_1 = require("typeorm");
const fs_1 = __importDefault(require("fs"));
const User_1 = require("./entity/User");
const app = express_1.default();
const port = 3000;
var dbConnection;
app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.get('/checkdb', (req, res) => {
    fs_1.default.readFile('./private/dbpass.txt', 'utf8', (readFileError, data) => {
        if (readFileError) {
            console.error(readFileError);
            res.send('Couldn\'t find the password');
        }
        typeorm_1.createConnection({
            type: 'mysql',
            host: 'localhost',
            port: 3306,
            username: 'nodejs',
            password: data.trim(),
            database: 'scrapbook_dev',
            synchronize: true,
            logging: false,
            entities: [
                __dirname + '/entity/*.js'
            ]
        }).then((connection) => {
            dbConnection = connection;
            res.send('Successfully connected to database');
        }).catch((error) => {
            console.error(error);
            res.send('Couldn\'t connect to the database');
        });
    });
});
app.get('/listusers', async (req, res) => {
    if (dbConnection === undefined || dbConnection === null) {
        res.send('No database connection found');
    }
    let userRepository = dbConnection.getRepository(User_1.User);
    let allUsers = await userRepository.find();
    res.writeHead(200, { 'Content-Type': 'text/html' });
    allUsers.forEach((user) => {
        res.write(user.displayName);
    });
    res.end();
});
app.get('/:test', (req, res) => {
    res.send(`Hello ${req.param('test', 'World.')}!`);
});
app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
});
//# sourceMappingURL=app.js.map