import express, {Request, Response, NextFunction} from 'express';
//import jwt from 'jsonwebtoken';
const jwt = require('jsonwebtoken'); // Need to do this so TypeScript doesn't throw an error about properties not existing on the decodedToken - https://stackoverflow.com/questions/47508424/how-to-get-token-expiration-with-jsonwebtoken-using-typescript
import fs from 'fs';
import {promisify} from 'util';

import DatabaseHelper from './databaseHelper';

const databaseHelper: DatabaseHelper = new DatabaseHelper();

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
                let jwtID: string = decodedToken2.jti;
                let activeJTI: string | null = await databaseHelper.getValidJWTForUserId(decodedToken2.id);

                if (jwtID !== activeJTI) {
                    return res.status(401).json({success: false, message: 'Unauthorized - Login Expired'});
                }

                req.userId = decodedToken2.id;

                next();
            }
            else {
                return res.status(401).json({success: false, message: 'Unauthorized'});
            }
        }
        catch (err) {
            return res.status(401).json({success: false, message: 'Unauthorized Error'});
        }
    }

    static async decodeToken(req: Request, res: Response, next: NextFunction) {
        let jwtSecret: string = await AuthHelper.getJWTSecret();
        let token: string = req.cookies['authToken'] as string;
        
        if (!token) {
            next();
        }
        else {
            try {
                let decodedToken = jwt.verify(token, jwtSecret);

                if (decodedToken) {
                    req.userId = decodedToken.id;
                    next();
                }
            }
            catch (err) {
                return res.status(500).json({success: false, message: 'Internal Server Error'});
            }
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