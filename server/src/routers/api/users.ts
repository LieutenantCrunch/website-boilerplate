import express, {Request, Response, Router, NextFunction} from 'express';

import {User} from '../../entity/User';
import DatabaseHelper from '../../utilities/databaseHelper';
import AuthHelper from '../../utilities/authHelper';

const databaseHelper: DatabaseHelper = new DatabaseHelper();

const apiUserRouter = express.Router();

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
    case 'currentUsername':
        if (req.userId) {
            if (databaseHelper === undefined || databaseHelper === null) {
                res.send('No database connection found');
            }

            const currentUser: User | undefined = await databaseHelper.getUserWithId(req.userId);

            if (currentUser) {
                res.status(200).json({username: currentUser.email});
            }
            else {
                res.status(200).json({username: 'Not Found!'});
            }
        }
        break;
    default:
        res.status(404).send(req.params.methodName + ' is not a valid users method')
        break;
    }
});

export {apiUserRouter};