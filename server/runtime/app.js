"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const filehandler_1 = __importDefault(require("./utilities/filehandler"));
const databaseHelper_1 = __importDefault(require("./utilities/databaseHelper"));
const app = express_1.default();
const port = 3000;
const fileHandler = new filehandler_1.default();
var databaseHelper = new databaseHelper_1.default();
function send404Response(res, message = 'Not Found') {
    res.status(404).send(message);
}
;
// Serve static files out of the dist directory using the static middleware function
app.use(express_1.default.static('dist'));
// Parse request bodies as JSON
app.use(express_1.default.json());
app.get('/api/users/:methodName', async (req, res) => {
    switch (req.params.methodName) {
        case 'list':
            if (databaseHelper === undefined || databaseHelper === null) {
                res.send('No database connection found');
            }
            let allUsers = await databaseHelper.getAllUsers();
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
            if (!req.body) {
                res.status(202).json({ success: false, message: 'You must provide registration info' });
            }
            else if (req.body.email) {
                let email = req.body.email;
                let userExists = await databaseHelper.userExistsForEmail(email);
                if (userExists) {
                    res.status(202).json({ success: false, message: 'That email address is already in use' });
                }
                else {
                    res.status(200).json({ success: true, message: 'That email address is available' });
                }
            }
            else {
                res.status(202).json({ success: false, message: 'You must provide an email address' });
            }
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