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
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const fileHandler_1 = __importDefault(require("./utilities/fileHandler"));
const Constants = __importStar(require("./constants/constants"));
const authHelper_1 = __importDefault(require("./utilities/authHelper"));
const app = express_1.default();
const port = 3000;
const corsOptions = {
    origin: Constants.BASE_API_URL
};
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
// Set up express to parse cookies
app.use(cookie_parser_1.default());
// Specify allowed headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept');
    next();
});
const api_1 = require("./routers/api");
app.use('/api', api_1.apiRouter);
app.get(/^\/(index)?$/, (req, res) => {
    fileHandler_1.default.sendFileResponse(res, './dist/index.html', 'text/html');
});
app.get('/profile', [authHelper_1.default.verifyToken], (req, res) => {
    fileHandler_1.default.sendFileResponse(res, './dist/index.html', 'text/html');
});
// It may be necessary to direct everything other than api calls to index due to the single page app
app.get('*', (req, res) => {
    fileHandler_1.default.sendFileResponse(res, './dist/index.html', 'text/html');
});
app.use((req, res) => {
    send404Response(res);
});
app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
});
//# sourceMappingURL=app.js.map