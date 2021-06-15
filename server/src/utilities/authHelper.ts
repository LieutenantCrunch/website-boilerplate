import express, {Request, Response, NextFunction} from 'express';
import * as SocketIO from 'socket.io';
//import jwt from 'jsonwebtoken';
const jwt = require('jsonwebtoken'); // Need to do this so TypeScript doesn't throw an error about properties not existing on the decodedToken - https://stackoverflow.com/questions/47508424/how-to-get-token-expiration-with-jsonwebtoken-using-typescript
import fs from 'fs';
import {promisify} from 'util';
import cookie from 'cookie';

import { dbMethods } from '../database/dbMethods';
import * as ServerConstants from '../constants/constants.server';

// Socket.IO
import { ExtendedError } from 'socket.io/dist/namespace'; // This auto Auto imported from verifySocketToken
import { socketCache } from './socketCache';

export default class AuthHelper {
    private static jwtSecret: string = '';

    private static async _verifyToken(token: string): Promise<{ results: number, decodedToken?: any }> {
        try {
            let jwtSecret: string = await AuthHelper.getJWTSecret();
            let decodedToken = jwt.verify(token, jwtSecret);

            if (decodedToken) {
                let jwtID: string = decodedToken.jti;
                let isValid: Boolean = await dbMethods.Users.Authorization.validateJWTForUserId(decodedToken.id, jwtID);

                if (!isValid) {
                    return {results: ServerConstants.VERIFY_TOKEN_RESULTS.EXPIRED};
                }
               
                return {results: ServerConstants.VERIFY_TOKEN_RESULTS.VALID, decodedToken};
            }
            else {
                return {results: ServerConstants.VERIFY_TOKEN_RESULTS.INVALID};
            }
        }
        catch (err) {
            console.error(`Error verifying token:\n${err.message}`);
        }

        return {results: ServerConstants.VERIFY_TOKEN_RESULTS.ERROR};
    }

    static async verifySocketToken(socket: SocketIO.Socket, next: (err?: ExtendedError | undefined) => void) {
        let socketCookie: string | undefined = socket.handshake.headers.cookie;
        let verifyResults: number = ServerConstants.VERIFY_TOKEN_RESULTS.INVALID;

        if (socketCookie) {
            let socketCookies: {[key: string]: string} = cookie.parse(socketCookie);
            let token: string | undefined = socketCookies['authToken'];

            if (token !== undefined) {
                let decodedToken: any | undefined = undefined;

                ({ results: verifyResults, decodedToken } = await AuthHelper._verifyToken(token));

                if (verifyResults === ServerConstants.VERIFY_TOKEN_RESULTS.VALID) {
                    socketCache.setSocket(decodedToken!.id, socket.id, socket);

                    return next();
                }
            }
        }

        switch (verifyResults) {
            case ServerConstants.VERIFY_TOKEN_RESULTS.INVALID:
                return next(new Error('Invalid authtoken on socket'));
            case ServerConstants.VERIFY_TOKEN_RESULTS.EXPIRED:
                return next(new Error('Expired authToken on socket'));
            default:
                return next(new Error('Error verifying authToken on socket'));
        }
    };

    static async verifyToken(req: Request, res: Response, next: NextFunction) {
        let token: string = req.cookies['authToken'] as string;
        
        if (!token) {
            return res.redirect('/');
        }

        let {results: verifyResults, decodedToken}: {results: number, decodedToken?: any} = await AuthHelper._verifyToken(token);

        switch(verifyResults) {
            case ServerConstants.VERIFY_TOKEN_RESULTS.VALID:
                req.userId = decodedToken!.id;
                req.jti = decodedToken!.jti;
                req.authToken = token;

                return next();
            case ServerConstants.VERIFY_TOKEN_RESULTS.EXPIRED:
                return res.status(401).json({success: false, message: 'Unauthorized - Login Expired'});
            case ServerConstants.VERIFY_TOKEN_RESULTS.INVALID:
                return res.status(401).json({success: false, message: 'Unauthorized'});
            default:
                return res.status(401).json({success: false, message: 'Unauthorized Error'});
        }
    }

    static async verifyTokenAndPassThrough(req: Request, res: Response, next: NextFunction) {
        let token: string = req.cookies['authToken'] as string;
        
        if (token) {
            let { decodedToken } : {decodedToken?: any} = await AuthHelper._verifyToken(token);

            if (decodedToken !== undefined) {
                req.userId = decodedToken.id;
                req.jti = decodedToken.jti;
                req.authToken = token;
            }
        }

        next();
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
        let uniqueId: string | undefined = req.userId;

        if (uniqueId) {
            let hasAdminRole: Boolean = await dbMethods.Users.Roles.checkUserForRole(uniqueId, 'Administrator');

            if (hasAdminRole) {
                return next();
            }
        }
        
        return res.redirect('/');
    }

    static async verifyNotBlocked(req: Request, res: Response, next: NextFunction) {
        let uniqueId: string | undefined = req.userId;

        if (uniqueId) {
            //let isNotBlocked: Boolean = await dbMethods.Users.Blocking.checkUserForBlock(uniqueId, );
        }

        return next();
    }
};