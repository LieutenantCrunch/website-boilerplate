import express, {Request, Response, NextFunction} from 'express';
//import jwt from 'jsonwebtoken';
const jwt = require('jsonwebtoken'); // Need to do this so TypeScript doesn't throw an error about properties not existing on the decodedToken - https://stackoverflow.com/questions/47508424/how-to-get-token-expiration-with-jsonwebtoken-using-typescript
import fs from 'fs';
import {promisify} from 'util';

export default class AuthHelper {
    private static jwtSecret: string = '';

    static async verifyToken(req: Request, res: Response, next: NextFunction) {
        let jwtSecret: string = await AuthHelper.getJWTSecret();
        //let token: string = req.headers['x-access-token'] as string;
        let token2: string = req.cookies['authToken'] as string;
        
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
            return res.status(401).json({success: false, message: 'Unauthorized'});
        }
    }

    static async getJWTSecret(): Promise<string> {
        const readFileAsync = promisify(fs.readFile);
    
        if (this.jwtSecret === '') {
            try
            {
                this.jwtSecret = (await readFileAsync('./private/jwtsecret.txt', 'utf8')).trim();
            }
            catch (readFileError)
            {
                console.error (readFileError);
            }
        }
    
        return this.jwtSecret;
    }
};