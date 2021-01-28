import express, {Request, Response, Router, NextFunction} from 'express';

import { databaseHelper } from '../../utilities/databaseHelper';
import AuthHelper from '../../utilities/authHelper';
import {apiUserPFPRouter} from './users/pfp';

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

                let userDetails: WebsiteBoilerplate.UserDetails | null = await databaseHelper.getUserDetails(req.userId, req.userId, true);

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
            let hasEmailRole: Boolean = false;
            let currentId: string | undefined = req.userId;

            if (currentId) {
                if (await databaseHelper.checkUserForRole(currentId, 'Administrator')) {
                    hasEmailRole = true;
                }
            }

            if (req.query.uniqueId) {
                if (databaseHelper === undefined || databaseHelper === null) {
                    res.send('No database connection found');
                }

                let userDetails: WebsiteBoilerplate.UserDetails | null = await databaseHelper.getUserDetails(currentId, req.query.uniqueId.toString(), hasEmailRole);

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
    case 'getProfileInfo':
        try {
            let hasEmailRole: Boolean = false;
            let currentId: string | undefined = req.userId;

            if (currentId) {
                if (await databaseHelper.checkUserForRole(currentId, 'Administrator')) {
                    hasEmailRole = true;
                }
            }

            if (req.query.profileName) {
                if (databaseHelper === undefined || databaseHelper === null) {
                    res.send('No database connection found');
                }

                let profileInfo: WebsiteBoilerplate.ProfileInfo | null = await databaseHelper.getProfileInfo(currentId, req.query.profileName.toString(), hasEmailRole);

                if (profileInfo) {
                    return res.status(200).json({success: true, profileInfo});
                }
                else {
                    return res.status(200).json({success: false, message: 'Could not find a user with that profile name'});
                }
            }
        }
        catch (err) {
            return res.status(200).json({success: false, message: 'An error occurred while looking up the profile.'});
        }
        break;
    case 'search':
        try {
            if (req.query.displayNameFilter && req.userId) {
                let userID: string = req.userId;
                let displayNameFilter: string = req.query.displayNameFilter.toString();
                let displayNameIndexFilter: number =  req.query.displayNameIndexFilter ? parseInt(req.query.displayNameIndexFilter.toString()) : -1;
                let pageNumber: number = req.query.pageNumber ? parseInt(req.query.pageNumber.toString()) : 0;
                let excludeConnections: Boolean = req.query.excludeConnections ? req.query.excludeConnections.toString().toLowerCase() === 'true' : false;

                let results: WebsiteBoilerplate.UserSearchResults | null = await databaseHelper.searchUsers(userID, displayNameFilter, displayNameIndexFilter, pageNumber, excludeConnections);

                return res.status(200).json({success: true, results});
            }
        }
        catch (err) {
            console.error(err.message);
        }

        return res.status(200).json({success: false, results: []});
    case 'getOutgoingConnections':
        try {
            if (req.query.uniqueId) {
                let uniqueId: string = req.query.uniqueId.toString();
                let connections: WebsiteBoilerplate.UserConnectionDetails = await databaseHelper.getOutgoingConnections(uniqueId);

                return res.status(200).json({success: true, connections});
            }
        }
        catch (err) {
            console.error(err.message);
        }

        return res.status(200).json({success: false, connections: {}});
    case 'getIncomingConnections':
        try {
            if (req.query.uniqueId) {
                let uniqueId: string = req.query.uniqueId.toString();
                let connections: WebsiteBoilerplate.UserConnectionDetails = await databaseHelper.getIncomingConnections(uniqueId);

                return res.status(200).json({success: true, connections});
            }
        }
        catch (err) {
            console.error(err.message);
        }

        return res.status(200).json({success: false, connections: {}});
    case 'getConnectionTypeDict':
        try {
            let connectionTypeDict: WebsiteBoilerplate.UserConnectionTypeDictionary = await databaseHelper.getConnectionTypeDict();

            return res.status(200).json({success: true, connectionTypeDict});
        }
        catch (err) {
            console.error(err.message);
        }

        return res.status(200).json({success: false, connectionTypeDict: {}});
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
            let uniqueId = req.userId;
            let { userUniqueID, displayName } = req.body;

            if (uniqueId && userUniqueID && displayName) {
                if (await databaseHelper.checkUserForRole(uniqueId, 'Administrator')) {
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
            let uniqueId = req.userId;
            let { outgoingConnection } = req.body;

            if (uniqueId && outgoingConnection) {
                let result: Boolean = await databaseHelper.updateUserConnection(uniqueId, outgoingConnection);

                return res.status(200).json({success: result, message: ''});
            }
        }
        catch (err) {
            console.error(`Error updating connection\n${err.message}`);
        }

        res.status(200).json({success: false, message: 'An error occurred while updating the connection'});

        break;
    case 'removeConnection':
            try {
                let uniqueId = req.userId;
                let { connectedUserUniqueId } = req.body;
    
                if (uniqueId && connectedUserUniqueId) {
                    let result: Boolean = await databaseHelper.removeUserConnection(uniqueId, connectedUserUniqueId);
    
                    return res.status(200).json({success: result, message: ''});
                }
            }
            catch (err) {
                console.error(`Error removing connection\n${err.message}`);
            }
    
            res.status(200).json({success: false, message: 'An error occurred while removing the connection'});
    
            break;
    default:
        res.status(404).send(req.params.methodName + ' is not a valid users method')
        break;
    }
});

export {apiUserRouter};