"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const cors_1 = __importDefault(require("cors"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fileHandler_1 = __importDefault(require("./utilities/fileHandler"));
const databaseHelper_1 = __importDefault(require("./utilities/databaseHelper"));
const Constants = __importStar(require("./constants/constants"));
const authHelper_1 = __importDefault(require("./utilities/authHelper"));
const app = express_1.default();
const port = 3000;
const corsOptions = {
    origin: Constants.BASE_API_URL
};
const fileHandler = new fileHandler_1.default();
const databaseHelper = new databaseHelper_1.default();
let jwtSecret = '';
async function getJWTSecret() {
    const readFileAsync = util_1.promisify(fs_1.default.readFile);
    if (jwtSecret === '') {
        try {
            jwtSecret = (await readFileAsync('./private/jwtsecret.txt', 'utf8')).trim();
        }
        catch (readFileError) {
            console.error(readFileError);
        }
    }
    return jwtSecret;
}
function send404Response(res, message = 'Not Found') {
    res.status(404).send(message);
}
;
// Serve static files out of the dist directory using the static middleware function
app.use(express_1.default.static('dist'));
// Parse request bodies as JSON
app.use(express_1.default.json());
// Parse url encoded request bodies, supporting qs, which allows nested objects in query strings
app.use(express_1.default.urlencoded({ extended: true }));
// Set up the CORS middleware with options
app.use(cors_1.default(corsOptions));
// Specify allowed headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept');
    next();
});
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
app.get('/profile', [authHelper_1.default.verifyToken], (req, res) => {
    fileHandler.sendFileResponse(res, './dist/index.html', 'text/html');
});
// It may be necessary to direct everything other than api calls to index due to the single page app
app.get('*', (req, res) => {
    fileHandler.sendFileResponse(res, './dist/index.html', 'text/html');
});
app.post('/api/auth/:methodName', async (req, res) => {
    switch (req.params.methodName) {
        case 'register':
            if (!req.body) {
                res.status(200).json({ success: false, message: 'You must provide registration info' });
            }
            else {
                let canContinue = true;
                if (req.body.email) {
                    let email = req.body.email;
                    let userExists = await databaseHelper.userExistsForEmail(email);
                    if (userExists) {
                        canContinue = false;
                        res.status(200).json({ success: false, message: 'That email address is already in use' });
                    }
                }
                else {
                    canContinue = false;
                    res.status(200).json({ success: false, message: 'You must provide an email address' });
                }
                if (canContinue) {
                    if (req.body.password && req.body.confirmPassword && req.body.password === req.body.confirmPassword) {
                        // Validate password strength
                        let registerResults = await databaseHelper.registerNewUser(req.body.email, req.body.password);
                        if (registerResults.success) {
                            res.status(200).json({ success: true, message: 'Registration success! You can now log in' });
                        }
                        else {
                            res.status(200).json({ success: false, message: 'An error occurred during registration' });
                        }
                    }
                    else {
                        res.status(200).json({ success: false, message: 'Your passwords did not match' });
                    }
                }
            }
            break;
        case 'login':
            if (!req.body) {
                res.status(200).json({ success: false, message: 'You must provide valid credentials' });
            }
            else {
                if (req.body.email && req.body.password) {
                    let loginResults = await databaseHelper.validateCredentials(req.body.email, req.body.password);
                    if (loginResults.success) {
                        let userID = loginResults.id;
                        let secret = await getJWTSecret();
                        let authToken = jsonwebtoken_1.default.sign({ id: userID }, secret); /* Could pass in options on the third parameter */
                        res.status(200).json({ success: true, message: 'Login successful', userInfo: { authToken: authToken } });
                    }
                    else {
                        let userID = loginResults.id;
                        res.status(200).json({ success: false, message: 'The credentials provided are not valid' });
                    }
                }
                else {
                    res.status(200).json({ success: false, message: 'You must provide a valid email address and password' });
                }
            }
            break;
        default:
            send404Response(res, req.params.methodName + ' is not a valid auth method');
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