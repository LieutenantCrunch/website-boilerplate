"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = express_1.default();
const port = 3000;
app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.get('/:test', (req, res) => {
    res.send(`Hello ${req.param('test', 'World.')}!`);
});
app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map