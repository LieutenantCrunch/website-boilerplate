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
        let token: string = req.cookies['authToken'] as string;
        
        if (!token) {
            return res.redirect('/');
        }

        try {
            let decodedToken = jwt.verify(token, jwtSecret);

            if (decodedToken) {
                let jwtID: string = decodedToken.jti;
                let isValid: Boolean = await databaseHelper.validateJWTForUserId(decodedToken.id, jwtID);

                if (!isValid) {
                    return res.status(401).json({success: false, message: 'Unauthorized - Login Expired'});
                }

                req.userId = decodedToken.id;
                req.jti = decodedToken.jti;
                req.authToken = token;

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
                    req.jti = decodedToken.jti;
                    req.authToken = token;
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

    static async verifyAdmin(req: Request, res: Response, next: NextFunction) {
        let uniqueID: string | undefined = req.userId;

        if (uniqueID) {
            let hasAdminRole: Boolean = await databaseHelper.checkUserForRole(uniqueID, 'Administrator');

            if (hasAdminRole) {
                next();
            }
            else {
                res.redirect('/');
            }
        }
    }
};