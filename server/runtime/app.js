"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const typeorm_1 = require("typeorm");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const User_1 = require("./entity/User");
const filehandler_1 = __importDefault(require("./utilities/filehandler"));
const app = express_1.default();
const port = 3000;
var dbConnection;
const fileHandler = new filehandler_1.default();
app.get(/^\/(index)?$/, (req, res) => {
    fileHandler.sendFileResponse(res, './dist/index.html', 'text/html');
});
app.get(/.css$/, (req, res) => {
    const cssFileName = path_1.default.resolve('./dist', req.path.substr(1));
    fileHandler.sendFileResponse(res, cssFileName, 'text/css');
});
app.get(/\.js$/, (req, res) => {
    const jsFileName = path_1.default.resolve('./dist', req.path.substr(1));
    fileHandler.sendFileResponse(res, jsFileName, 'text/javascript');
});
app.get('/api/:methodName', async (req, res) => {
    switch (req.params.methodName) {
        case 'check-db':
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
            break;
        case 'list-users':
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
            break;
        default:
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.write('Not Found');
            res.end();
            break;
    }
});
app.use((req, res) => {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.write('Not Found');
    res.end();
});
app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
});
//# sourceMappingURL=app.js.map