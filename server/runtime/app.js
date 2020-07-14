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
const filehandler_1 = __importDefault(require("./utilities/filehandler"));
const app = express_1.default();
const port = 3000;
var dbConnection;
const fileHandler = new filehandler_1.default();
function send404Response(res, message = 'Not Found') {
    res.status(404).send(message);
}
;
// Serve static files out of the dist directory using the static middleware function
app.use(express_1.default.static('dist'));
app.get('/api/users/:methodName', async (req, res) => {
    switch (req.params.methodName) {
        case 'list':
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
            send404Response(res, req.params.methodName + ' is not a valid users method');
            break;
    }
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
        default:
            send404Response(res, req.params.methodName + ' is not a valid method');
            break;
    }
});
app.get(/^\/(index)?$/, (req, res) => {
    fileHandler.sendFileResponse(res, './dist/index.html', 'text/html');
});
// It may be necessary to direct everything other than api calls to index due to the single page app
app.get('*', (req, res) => {
    fileHandler.sendFileResponse(res, './dist/index.html', 'text/html');
});
app.post('/api/users/:methodName', async (req, res) => {
    switch (req.params.methodName) {
        case 'register':
            res.status(200).json({
                success: true
            });
            break;
        case 'login':
            res.status(200).json({
                success: true
            });
            break;
        default:
            send404Response(res, req.params.methodName + ' is not a valid users method');
            break;
    }
});
app.post('/api/:methodName', async (req, res) => {
    switch (req.params.methodName) {
        default:
            send404Response(res, req.params.methodName + ' is not a valid method');
            break;
    }
});
app.use((req, res) => {
    send404Response(res);
});
app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
});
//# sourceMappingURL=app.js.map