import express, {Request, Response, Router, NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import AuthHelper from '../../utilities/authHelper';
import DatabaseHelper from '../../utilities/databaseHelper';
import * as Constants from '../../constants/constants';

import '../../extensions/date.extensions';

const databaseHelper: DatabaseHelper = new DatabaseHelper();

const apiAuthRouter: Router = express.Router();

apiAuthRouter.post('/:methodName', [AuthHelper.decodeToken], async (req: Request, res: Response) => {
    switch (req.params.methodName)
    {
    case 'register':
        if (!req.body) {
            res.status(200).json({success: false, message: 'You must provide registration info'});
        }
        else {
            let canContinue: Boolean = true;

            if (req.body.email) {
                let email: string = req.body.email;
                let userExists: Boolean = await databaseHelper.userExistsForEmail(email);

                if (userExists) {
                    canContinue = false;
                    res.status(200).json({success: false, message: 'That email address is already in use'});
                }
            }
            else {
                canContinue = false;
                res.status(200).json({success: false, message: 'You must provide an email address'});
            }

            if (canContinue) {
                if (req.body.password && req.body.confirmPassword && req.body.password === req.body.confirmPassword) {
                    // Validate password strength
                    let registerResults: {id: string | null, success: Boolean} = await databaseHelper.registerNewUser(req.body.email, req.body.password);
                    
                    if (registerResults.success) {
                        res.status(200).json({success: true, message: 'Registration success! You can now log in'});
                    }
                    else {
                        res.status(200).json({success: false, message: 'An error occurred during registration'});
                    }
                }
                else {
                    res.status(200).json({success: false, message: 'Your passwords did not match'});
                }
            }
        }
        break;
    case 'login':
        if (!req.body) {
            res.status(200).json({success: false, message: 'You must provide valid credentials'});
        }
        else {
            if (req.body.email && req.body.password) {
                let loginResults: {id: string | null, success: Boolean} = await databaseHelper.validateCredentials(req.body.email, req.body.password);

                if (loginResults.success) {
                    let userID: string | null = loginResults.id;
                    let secret: string = await AuthHelper.getJWTSecret();
                    let jti: string = uuidv4();
                    let authToken: string = jwt.sign({id: userID}, secret, {expiresIn: (60 * 60 * 24 * Constants.JWT_EXPIRATION_DAYS), jwtid: jti}); /* Could pass in options on the third parameter */
                    let expirationDate: Date = new Date(Date.now()).addDays(Constants.JWT_EXPIRATION_DAYS);

                    let jwtResults: {success: Boolean} = await databaseHelper.addJWTToUser(userID!, {jti, expirationDate})

                    if (jwtResults.success) {
                        res.status(200)
                            .cookie('authToken', authToken, {
                                httpOnly: true,
                                sameSite: true,
                                expires: expirationDate
                            })
                            .json({success: true, message: 'Login successful', userInfo: {loginDate: Date.now(), expirationDate: (Date.now() + 180)/*expirationDate.valueOf()*/}});
                        //res.status(200).json({success: true, message: 'Login successful', userInfo: {authToken: authToken}});
                    }
                    else {
                        res.status(200).json({success: false, message: 'Failed to secure a session with the server, please try again or contact support'});
                    }
                }
                else {
                    let userID: string | null = loginResults.id;
                    res.status(200).json({success: false, message: 'The credentials provided are not valid'});
                }
            }
            else {
                res.status(200).json({success: false, message: 'You must provide a valid email address and password'});
            }
        }
        break;
    case 'logout':
        if (req.userId) {
            await databaseHelper.invalidateJWTsForUser(req.userId);
        }

        res.status(200)
            .clearCookie('authToken')
            .json({success: true, message: 'You have been logged out'});
        break;
    default:
        res.status(404).send(req.params.methodName + ' is not a valid auth method');
        break;
    }
});

export {apiAuthRouter};