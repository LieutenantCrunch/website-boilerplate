"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//import jwt from 'jsonwebtoken';
const jwt = require('jsonwebtoken'); // Need to do this so TypeScript doesn't throw an error about properties not existing on the decodedToken - https://stackoverflow.com/questions/47508424/how-to-get-token-expiration-with-jsonwebtoken-using-typescript
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
class AuthHelper {
    static async verifyToken(req, res, next) {
        const readFileAsync = util_1.promisify(fs_1.default.readFile);
        let jwtSecret = (await readFileAsync('./private/jwtsecret.txt', 'utf8')).trim();
        let token = req.headers['x-access-token'];
        if (!token) {
            return res.status(403).json({ success: false, message: 'No authorization token provided' });
        }
        try {
            let decodedToken = jwt.verify(token, jwtSecret);
            if (decodedToken) {
                req.userId = decodedToken.id;
            }
            next();
        }
        catch (err) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
    }
}
exports.default = AuthHelper;
;
//# sourceMappingURL=authHelper.js.map