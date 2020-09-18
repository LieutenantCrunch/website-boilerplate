import express, {Request, Response, Router, NextFunction} from 'express';

import {User} from '../../entity/User';
import DatabaseHelper from '../../utilities/databaseHelper';
import AuthHelper from '../../utilities/authHelper';
import {apiUserPFPRouter} from './users/pfp';

const databaseHelper: DatabaseHelper = new DatabaseHelper();

const apiUserRouter = express.Router();

apiUserRouter.use('/pfp', apiUserPFPRouter);

apiUserRouter.get('/:methodName', [AuthHelper.verifyToken], async (req: Request, res: Response) => {
    switch (req.params.methodName)
    {
    case 'list':
        if (databaseHelper === undefined || databaseHelper === null) {
            res.send('No database connection found');
        }
    
        let allUsers: User[] = await databaseHelper.getAllUsers();
    
        res.writeHead(200, {'Content-Type': 'text/html'});
    
        allUsers.forEach((user: User) => {
            res.write(user.displayName);
        });
    
        res.end();
        break;
    case 'currentDisplayName':
        if (req.userId) {
            if (databaseHelper === undefined || databaseHelper === null) {
                res.send('No database connection found');
            }

            const displayName: string | null = await databaseHelper.getUserDisplayName(req.userId);

            if (displayName) {
                res.status(200).json({displayName});
            }
            else {
                res.status(200).json({displayName: 'Not Found!'});
            }
        }
        break;
    case 'currentEmail':
        if (req.userId) {
            if (databaseHelper === undefined || databaseHelper === null) {
                res.send('No database connection found');
            }

            const email: string | null = await databaseHelper.getUserEmail(req.userId);

            if (email) {
                res.status(200).json({email});
            }
            else {
                res.status(200).json({email: 'Not Found!'});
            }
        }
        break;
    case 'currentUserDetails':
        if (req.userId) {
            if (databaseHelper === undefined || databaseHelper === null) {
                res.send('No database connection found');
            }

            let userDetails: WebsiteBoilerplate.UserDetails | null = await databaseHelper.getUserDetails(req.userId);

            if (userDetails) {
                return res.status(200).json({success: true, userDetails});
            }
            else {
                return res.status(200).json({success: false});
            }
        }
        break;
    default:
        res.status(404).send(req.params.methodName + ' is not a valid users method')
        break;
    }
});

apiUserRouter.post('/:methodName', [AuthHelper.verifyToken], async (req: Request, res: Response) => {
    switch (req.params.methodName)
    {
    case 'setDisplayName':
        if (req.userId && req.body.displayName) {
            if (databaseHelper === undefined || databaseHelper === null) {
                res.send('No database connection found');
            }

            const results: {success: Boolean, displayNameIndex?: number, message?: string} = await databaseHelper.setUserDisplayName(req.userId, req.body.displayName);

            res.status(200).json(results);
        }
        break;
    default:
        res.status(404).send(req.params.methodName + ' is not a valid users method')
        break;
    }
});

export {apiUserRouter};