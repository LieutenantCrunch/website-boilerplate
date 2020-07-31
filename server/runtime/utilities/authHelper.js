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
        let jwtSecret = await AuthHelper.getJWTSecret();
        //let token: string = req.headers['x-access-token'] as string;
        let token2 = req.cookies['authToken'];
        if (!token2) {
            return res.redirect('/');
        }
        /*if (!token) {
            return res.redirect('/');
            //return res.status(403).json({success: false, message: 'No authorization token provided'});
        }*/
        try {
            //let decodedToken = jwt.verify(token, jwtSecret);
            let decodedToken2 = jwt.verify(token2, jwtSecret);
            /*if (decodedToken) {
                req.userId = decodedToken.id;
            }*/
            if (decodedToken2) {
                req.userId = decodedToken2.id;
            }
            next();
        }
        catch (err) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
    }
    static async getJWTSecret() {
        const readFileAsync = util_1.promisify(fs_1.default.readFile);
        if (this.jwtSecret === '') {
            try {
                this.jwtSecret = (await readFileAsync('./private/jwtsecret.txt', 'utf8')).trim();
            }
            catch (readFileError) {
                console.error(readFileError);
            }
        }
        return this.jwtSecret;
    }
}
exports.default = AuthHelper;
AuthHelper.jwtSecret = '';
;
//# sourceMappingURL=authHelper.js.map