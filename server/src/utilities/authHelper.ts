import express, {Request, Response, NextFunction} from 'express';
//import jwt from 'jsonwebtoken';
const jwt = require('jsonwebtoken'); // Need to do this so TypeScript doesn't throw an error about properties not existing on the decodedToken - https://stackoverflow.com/questions/47508424/how-to-get-token-expiration-with-jsonwebtoken-using-typescript
import fs from 'fs';
import {promisify} from 'util';

export default class AuthHelper {
    static async verifyToken(req: Request, res: Response, next: NextFunction) {
        const readFileAsync = promisify(fs.readFile);
        let jwtSecret: string = (await readFileAsync('./private/jwtsecret.txt', 'utf8')).trim();
        let token: string = req.headers['x-access-token'] as string;
        
        if (!token) {
            return res.status(403).json({success: false, message: 'No authorization token provided'});
        }

        try {
            let decodedToken = jwt.verify(token, jwtSecret);

            if (decodedToken) {
                req.userId = decodedToken.id;
            }

            next();
        }
        catch (err) {
            return res.status(401).json({success: false, message: 'Unauthorized'});
        }
    }
};