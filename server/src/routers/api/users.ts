import express, {Request, Response, Router, NextFunction} from 'express';

import DatabaseHelper from '../../utilities/databaseHelper';
import AuthHelper from '../../utilities/authHelper';
import {apiUserPFPRouter} from './users/pfp';

const databaseHelper: DatabaseHelper = new DatabaseHelper();

const apiUserRouter = express.Router();

apiUserRouter.use('/pfp', apiUserPFPRouter);

apiUserRouter.get('/:methodName', [AuthHelper.verifyToken], async (req: Request, res: Response) => {
    switch (req.params.methodName)
    {
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
        try {
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
        }
        catch (err) {
            return res.status(200).json({success: false});
        }
        break;
    case 'getUserDetails':
        try {
            if (req.query.uniqueID) {
                if (databaseHelper === undefined || databaseHelper === null) {
                    res.send('No database connection found');
                }

                let userDetails: WebsiteBoilerplate.UserDetails | null = await databaseHelper.getUserDetails(req.query.uniqueID.toString());

                if (userDetails) {
                    return res.status(200).json({success: true, userDetails});
                }
                else {
                    return res.status(200).json({success: false});
                }
            }
        }
        catch (err) {
            return res.status(200).json({success: false});
        }
        break;
    case 'search':
        try {
            if (req.query.displayNameFilter) {
                let displayNameFilter: string = req.query.displayNameFilter.toString();
                let displayNameIndexFilter: number =  req.query.displayNameIndexFilter ? parseInt(req.query.displayNameIndexFilter.toString()) : -1;
                let pageNumber: number = req.query.pageNumber ? parseInt(req.query.pageNumber.toString()) : 0;

                let results: WebsiteBoilerplate.UserSearchResults | null = await databaseHelper.searchUsers(displayNameFilter, displayNameIndexFilter, pageNumber);

                return res.status(200).json({success: true, results});
            }
        }
        catch (err) {
            console.error(err.message);
        }

        return res.status(200).json({success: false, results: []});
    case 'getConnections':
        try {
            if (req.query.uniqueID) {
                let uniqueID: string = req.query.uniqueID.toString();
                let connections: WebsiteBoilerplate.UserConnectionDetails = await databaseHelper.getUserConnections(uniqueID);

                return res.status(200).json({success: true, connections});
            }
        }
        catch (err) {
            console.error(err.message);
        }

        return res.status(200).json({success: false, connections: {}});
    case 'getConnectionTypeDict':
        try {
            let connectionTypes: WebsiteBoilerplate.UserConnectionTypeDictionary = await databaseHelper.getConnectionTypeDict();

            return res.status(200).json({success: true, connectionTypes});
        }
        catch (err) {
            console.error(err.message);
        }

        return res.status(200).json({success: false, connectionTypes: {}});
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
        else {
            res.status(200).json({success: false, message: 'No user or display name found'});
        }
        break;
    case 'verifyDisplayName':
        try {
            let uniqueID = req.userId;
            let { userUniqueID, displayName } = req.body;

            if (uniqueID && userUniqueID && displayName) {
                if (await databaseHelper.checkUserForRole(uniqueID, 'Administrator')) {
                    let results: {success: Boolean, message: string} = await databaseHelper.verifyUserDisplayName(userUniqueID, displayName);

                    return res.status(200).json(results);
                }
            }
        }
        catch (err) {
            console.error(`Error verifying display name\n${err.message}`);
        }

        res.status(200).json({success: false, message: 'An error occurred while verifying the display name. Please check the log.'});

        break;
    case 'updateConnection':
        try {
            let uniqueID = req.userId;
            let { outgoingConnection } = req.body;

            if (uniqueID && outgoingConnection) {
                databaseHelper.updateUserConnection(uniqueID, outgoingConnection);

                return res.status(200).json({success: true, message: ''});
            }
        }
        catch (err) {
            console.error(`Error updating connection\n${err.message}`);
        }

        res.status(200).json({success: false, message: 'An error occurred while updating the connection'});

        break;
    default:
        res.status(404).send(req.params.methodName + ' is not a valid users method')
        break;
    }
});

export {apiUserRouter};