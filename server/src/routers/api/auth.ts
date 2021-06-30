import express, {Request, Response, Router, NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import zxcvbn from 'zxcvbn';

import AuthHelper from '../../utilities/authHelper';
import { dbMethods } from '../../database/dbMethods';
import * as ClientConstants from '../../constants/constants.client';
import * as ServerConstants from '../../constants/constants.server';

import '../../extensions/date.extensions';
import EmailHelper from '../../utilities/emailHelper';

const emailHelper: EmailHelper = new EmailHelper();

const apiAuthRouter: Router = express.Router();

apiAuthRouter.post('/:methodName', [AuthHelper.decodeToken], async (req: Request, res: Response) => {
    switch (req.params.methodName)
    {
    case 'register':
        if (!req.body) {
            res.status(200).json({success: false, message: 'You must provide registration info.'});
        }
        else {
            let canContinue: Boolean = true;

            if (req.body.firstName || req.body.lastName) {
                return res.status(200).json({success: true, message: `Registration success! Welcome to the site ${req.body.firstName} ${req.body.lastName}! You can now log in.`});
            }

            if (req.body.email) {
                let email: string = req.body.email;
                let userExists: Boolean = await dbMethods.Users.Searches.userExistsForEmail(email);

                if (userExists) {
                    canContinue = false;
                    res.status(200).json({success: false, message: 'That email address is already in use.'});
                }
            }
            else {
                canContinue = false;
                res.status(200).json({success: false, message: 'You must provide an email address.'});
            }

            if (canContinue && !req.body.displayName) {
                res.status(200).json({success: false, message: 'You must provide a display name.'});
                canContinue = false;
            }
            else if (canContinue && !req.body.profileName) {
                res.status(200).json({success: false, message: 'You must provide a profile name.'});
                canContinue = false;
            }

            if (canContinue) {
                if (req.body.password && req.body.confirmPassword && req.body.password === req.body.confirmPassword) {
                    if (zxcvbn(req.body.password).score < 3) {
                        res.status(200).json({success: false, message: 'Your password isn\'t strong enough.'});
                    }
                    else {
                        let registerResults: {id: string | null, success: Boolean} = await dbMethods.Users.registerNewUser(req.body.email, req.body.displayName, req.body.profileName, req.body.password);
                        
                        if (registerResults.success) {
                            res.status(200).json({success: true, message: 'Registration success! You can now log in.'});
                        }
                        else {
                            res.status(200).json({success: false, message: 'An error occurred during registration.'});
                        }
                    }
                }
                else {
                    res.status(200).json({success: false, message: 'Your passwords did not match.'});
                }
            }
        }
        break;
    case 'login':
        if (!req.body) {
            res.status(200).json({success: false, message: 'You must provide valid credentials.'});
        }
        else {
            if (req.body.email && req.body.password) {
                let uniqueId: string | null = await dbMethods.Users.Authorization.validateCredentials(req.body.email, req.body.password);

                if (uniqueId) {
                    let expirationDate: Date = new Date(Date.now()).addDays(ServerConstants.JWT_EXPIRATION_DAYS);
                    let jwtResults: {success: Boolean} = {success: false};

                    let authToken: string | undefined = undefined;

                    if (req.authToken) { // Scenario: Maybe they lost their client token but not their cookie, so they're trying to log in again, just extend the life of their current cookie
                        authToken = req.authToken;
                        jwtResults = await dbMethods.Users.Authorization.extendJWTForUser(uniqueId, {jti: req.jti!, expirationDate})
                    }
                    else {
                        let secret: string = await AuthHelper.getJWTSecret();
                        let jti: string = uuidv4();
                        authToken = jwt.sign({id: uniqueId}, secret, {expiresIn: (60 * 60 * 24 * ServerConstants.JWT_EXPIRATION_DAYS), jwtid: jti}); /* Could pass in options on the third parameter */

                        jwtResults = await dbMethods.Users.Authorization.addJWTToUser(uniqueId, {jti, expirationDate})
                    }

                    if (jwtResults.success) {
                        let startPage: string | undefined = await dbMethods.Users.Fields.getStartPageForUser(uniqueId);

                        res.status(200)
                            .cookie('authToken', authToken, {
                                expires: expirationDate,
                                httpOnly: true,
                                sameSite: 'strict',
                                secure: process.env.NODE_ENV === 'production'
                            })
                            .json({
                                loginDetails: {
                                    loginDate: Date.now(), 
                                    expirationDate: expirationDate.valueOf()
                                },
                                message: 'Login successful',
                                startPage,
                                success: true
                            });
                    }
                    else {
                        res.status(200).json({success: false, message: 'Failed to secure a session with the server, please try again or contact support.'});
                    }
                }
                else {
                    res.status(200).json({success: false, message: 'The credentials provided are not valid.'});
                }
            }
            else {
                res.status(200).json({success: false, message: 'You must provide a valid email address and password.'});
            }
        }
        break;
    case 'logout':
        if (req.userId && req.jti) {
            if (req.body.fromHere && req.body.fromOtherLocations) { // Everywhere - Here and Everywhere Else
                await dbMethods.Users.Authorization.invalidateJWTsForUser(req.userId, ServerConstants.INVALIDATE_TOKEN_MODE.ALL, req.jti); 
            }
            else if (!req.body.fromHere && req.body.fromOtherLocations) { // Everywhere Else - Not Here but Everywhere Else
                await dbMethods.Users.Authorization.invalidateJWTsForUser(req.userId, ServerConstants.INVALIDATE_TOKEN_MODE.OTHERS, req.jti);
            }
            else { // Only Here
                await dbMethods.Users.Authorization.invalidateJWTsForUser(req.userId, ServerConstants.INVALIDATE_TOKEN_MODE.SPECIFIC, req.jti);
            }
        }

        res.status(200)
            .clearCookie('authToken')
            .json({success: true, message: 'You have been logged out.'});
        break;
    case 'reset-password-request':
        if (req.body.email) {
            let tokenResults: {token: string | null, errorCode: number} = await dbMethods.Users.Authorization.generatePasswordResetToken(req.body.email);
            let success: Boolean = true;
            let message: string = 'If you are a valid user you will be sent a password reset email shortly. Please check your spam/junk folder if you do not see it soon.';

            if (tokenResults.token) {
                let resetPasswordLink: string = `${ClientConstants.BASE_URL}reset-password?token=${tokenResults.token}`;

                emailHelper.sendMail({
                    to: req.body.email,
                    subject: 'Password Reset',
                    text: `Hello, You are being sent this email because someone requested a password reset. If you did not request it, you can ignore this email; your password will not be reset. Please use the following link to reset your password: ${resetPasswordLink}`,
                    html: `<p>Hello,<br/>You are being sent this email because someone requested a password reset. If you did not request it, you can ignore this email; your password will not be reset.<br/>Please use the following link to reset your password: <b><a href="${resetPasswordLink}">${resetPasswordLink}</a><b></p>`
                });
            }
            else {
                switch (tokenResults.errorCode) {
                case 3: // Too many active reset tokens
                    success = false;
                    message = 'You have exceeded the maximum number of reset attempts, please try again later or contact support.';
                    break;
                case 2: // User not found
                    // They don't need to know this, pass it off as a success
                    break;
                case 1: // Exception
                default:
                    success = false;
                    message = 'I\'m sorry but an error occurred while trying to reset your password, please try again or contact support.';
                    break;
                }
            }

            // Generate a password reset record that lasts for 5 minutes
            // Send user email with link
            // Create route so when the link is clicked, it takes them to a page where they can enter a new password and reset

            res.status(200).json({success, message})
        }
        else {
            res.status(200).json({success: false, message: 'You must provide an email address'})
        }
        break;
    case 'reset-password':
        // Grab the token from the URL and send it up on the request
        // Make them re-enter their email address, a new password, and confirm the new password
        if (req.body.token && req.body.email) {
            // Verify email and token and that they match
            let tokenIsValid: Boolean = await dbMethods.Users.Authorization.validatePasswordResetToken(req.body.token, req.body.email);

            if (tokenIsValid) {
                if (req.body.password && req.body.confirmPassword && req.body.password === req.body.confirmPassword) {
                    // Update their password with the new one
                    if (await dbMethods.Users.Authorization.updateCredentials(req.body.email, req.body.password)) {
                        // Invalidate all of their existing JWTs
                        await dbMethods.Users.Authorization.invalidateJWTsForUser('', ServerConstants.INVALIDATE_TOKEN_MODE.ALL);

                        // Clear their cookie if they have one and send them back to the login
                        res.status(200)
                            .clearCookie('authToken')
                            .json({success: true, message: 'Your password has been changed, please log in using your new password'});
                    }
                    else {
                        res.status(200)
                            .json({success: false, message: 'We\'re sorry, but an error occurred while changing your password, please try again.'})
                    }
                }                
            }
            else {
                res.status(200)
                    .json({success: false, message: 'Your token has expired or is not valid, please request another password reset or contact support.'});
            }
        }
        else {
            res.status(200)
                .json({success: false, message: 'Your password has been changed, please log in using your new password.'});
        }

        break;
    default:
        res.status(404).send(req.params.methodName + ' is not a valid auth method.');
        break;
    }
});

export {apiAuthRouter};