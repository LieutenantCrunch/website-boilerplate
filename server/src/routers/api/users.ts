import express, {Request, Response, Router, NextFunction} from 'express';

import { dbMethods } from '../../database/dbMethods';
import AuthHelper from '../../utilities/authHelper';
import { checkBadWord } from '../../utilities/utilityFunctions';
import {apiUserPFPRouter} from './users/pfp';
import {apiUserPublicRouter} from './users/public';

const apiUserRouter = express.Router();

apiUserRouter.use('/pfp', apiUserPFPRouter);
apiUserRouter.use('/public', apiUserPublicRouter);

apiUserRouter.get('/:methodName', [AuthHelper.verifyToken], async (req: Request, res: Response) => {
    switch (req.params.methodName)
    {
    case 'currentDisplayName':
        if (req.userId) {
            const displayName: string | null = await dbMethods.Users.Fields.getUserDisplayName(req.userId);

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
            const email: string | null = await dbMethods.Users.Fields.getUserEmail(req.userId);

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
                let userDetails: WebsiteBoilerplate.UserDetails | null = await dbMethods.Users.Searches.getUserDetails(req.userId, req.userId, true);

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
    case 'getConnectionTypeDict':
        try {
            let connectionTypeDict: WebsiteBoilerplate.UserConnectionTypeDictionary = await dbMethods.Users.Connections.getConnectionTypeDict();

            return res.status(200).json({success: true, connectionTypeDict});
        }
        catch (err) {
            console.error(err.message);
        }

        return res.status(200).json({success: false, connectionTypeDict: {}});
    case 'getIncomingConnections':
        try {
            if ((req.query && req.query.uniqueId !== undefined) || req.userId !== undefined) {
                let uniqueId: string = '';
                
                if (req.query && req.query.uniqueId !== undefined) {
                    uniqueId = req.query.uniqueId.toString();
                }
                else {
                    uniqueId = req.userId!;
                }

                let connections: WebsiteBoilerplate.UserDetails[] = await dbMethods.Users.Connections.getIncomingConnections(uniqueId);

                return res.status(200).json({success: true, connections});
            }
        }
        catch (err) {
            console.error(err.message);
        }

        return res.status(200).json({success: false, connections: {}});
    case 'getOutgoingConnections':
        try {
            if ((req.query && req.query.uniqueId !== undefined) || req.userId !== undefined) {
                let uniqueId: string = '';
                
                if (req.query && req.query.uniqueId !== undefined) {
                    uniqueId = req.query.uniqueId.toString();
                }
                else {
                    uniqueId = req.userId!;
                }

                let connections: WebsiteBoilerplate.UserDetails[] = await dbMethods.Users.Connections.getOutgoingConnections(uniqueId);

                return res.status(200).json({success: true, connections});
            }
        }
        catch (err) {
            console.error(err.message);
        }

        return res.status(200).json({success: false, connections: {}});
    case 'getUserDetails':
        try {
            let hasEmailRole: Boolean = false;
            let currentId: string | undefined = req.userId;

            if (currentId) {
                if (await dbMethods.Users.Roles.checkUserForRole(currentId, 'Administrator')) {
                    hasEmailRole = true;
                }
            }

            if (req.query.uniqueId) {
                let userDetails: WebsiteBoilerplate.UserDetails | null = await dbMethods.Users.Searches.getUserDetails(currentId, req.query.uniqueId.toString(), hasEmailRole);

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
            if (req.query.displayNameFilter && req.userId) {
                let userID: string = req.userId;
                let displayNameFilter: string = req.query.displayNameFilter.toString();
                let displayNameIndexFilter: number =  req.query.displayNameIndexFilter ? parseInt(req.query.displayNameIndexFilter.toString()) : -1;
                let pageNumber: number = req.query.pageNumber ? parseInt(req.query.pageNumber.toString()) : 0;
                let excludeConnections: Boolean = req.query.excludeConnections ? req.query.excludeConnections.toString().toLowerCase() === 'true' : false;

                let results: WebsiteBoilerplate.UserSearchResults | null = await dbMethods.Users.Searches.searchUsers(userID, displayNameFilter, displayNameIndexFilter, pageNumber, excludeConnections);

                return res.status(200).json({success: true, results});
            }
        }
        catch (err) {
            console.error(err.message);
        }

        return res.status(200).json({success: false, results: []});
    default:
        res.status(404).send(req.params.methodName + ' is not a valid users method')
        break;
    }
});

apiUserRouter.post('/:methodName', [AuthHelper.verifyToken], async (req: Request, res: Response) => {
    switch (req.params.methodName)
    {
    case 'blockUser':
        try {
            let currentUserUniqueId = req.userId;
            let { blockUserUniqueId } = req.body;

            if (currentUserUniqueId && blockUserUniqueId) {
                let success: Boolean = await dbMethods.Users.Blocking.blockUser(currentUserUniqueId, blockUserUniqueId);

                return res.status(200).json({ success });
            }
        }
        catch (err) {
            console.error(`Error blocking user:\n${err.message}`);
        }

        return res.status(200).json({ success: false });
    case 'deleteAccount':
        try {
            let uniqueId: string | undefined = req.userId;

            if (uniqueId) {
                let success: Boolean = await dbMethods.Users.removeUser(uniqueId);

                return res.status(200).json({ success });
            }
        }
        catch (err) {
            console.error(`Error closing account for user:\n${err.message}`);
        }

        return res.status(200).json({ success: false });
    case 'removeConnection':
            try {
                let uniqueId = req.userId;
                let { connectedUserUniqueId } = req.body;
    
                if (uniqueId && connectedUserUniqueId) {
                    let results: WebsiteBoilerplate.RemoveUserConnectionResults = await dbMethods.Users.Connections.removeUserConnection(uniqueId, connectedUserUniqueId);
    
                    return res.status(200).json({success: results.success, results, message: ''});
                }
            }
            catch (err) {
                console.error(`Error removing connection\n${err.message}`);
            }
    
            res.status(200).json({success: false, message: 'An error occurred while removing the connection'});
    
            break;
    case 'setDisplayName':
        if (req.userId) {
            let displayName: string | undefined = req.body.displayName;

            if (displayName) {
                if (!checkBadWord(displayName)) {
                    const results: {success: Boolean, displayNameIndex?: number, message?: string} = await dbMethods.Users.Fields.setUserDisplayName(req.userId, req.body.displayName);

                    res.status(200).json(results);
                }
                else {
                    res.status(200).json({success: false, message: 'Invalid display name.'});
                }
            }
            else {
                res.status(200).json({success: false, message: 'No display name found.'});
            }
        }
        else {
            res.status(200).json({success: false, message: 'No user found.'});
        }
        break;
    case 'unblockUser':
        try {
            let currentUserUniqueId = req.userId;
            let { unblockUserUniqueId } = req.body;

            if (currentUserUniqueId && unblockUserUniqueId) {
                let success = await dbMethods.Users.Blocking.unblockUser(currentUserUniqueId, unblockUserUniqueId);

                return res.status(200).json({ success });
            }
        }
        catch (err) {
            console.error(`Error unblocking user:\n${err.message}`);
        }

        return res.status(200).json({ success: false });
    case 'updateConnection':
        try {
            let uniqueId = req.userId;
            let { connection } = req.body;

            if (uniqueId && connection) {
                let results: WebsiteBoilerplate.UpdateUserConnectionResults = await dbMethods.Users.Connections.updateUserConnection(uniqueId, connection);

                return res.status(200).json({success: results.success, results, message: ''});
            }
        }
        catch (err) {
            console.error(`Error updating connection\n${err.message}`);
        }

        res.status(200).json({success: false, results: null, message: 'An error occurred while updating the connection'});

        break;
    case 'updateUserPreferences':
        try {
            let uniqueId = req.userId;

            if (uniqueId) {
                let { preferences }: { preferences: Array<{ name: string, value: string | Boolean | number }> | undefined } = req.body;

                if (preferences !== undefined) {
                    if (await dbMethods.Users.Fields.updateUserPreferences(uniqueId, preferences)) {
                        return res.status(200).json({ success: true });
                    }
                }
            }
        }
        catch (err) {
            console.error(`Error updating user preferences\n${err.message}`);
        }

        res.status(200).json({ success: false });

        break;
    case 'verifyDisplayName':
        try {
            let uniqueId = req.userId;
            let { userUniqueID, displayName } = req.body;

            if (uniqueId && userUniqueID && displayName) {
                if (await dbMethods.Users.Roles.checkUserForRole(uniqueId, 'Administrator')) {
                    let results: {success: Boolean, message: string} = await dbMethods.Users.Fields.verifyUserDisplayName(userUniqueID, displayName);

                    return res.status(200).json(results);
                }
            }
        }
        catch (err) {
            console.error(`Error verifying display name\n${err.message}`);
        }

        res.status(200).json({success: false, message: 'An error occurred while verifying the display name. Please check the log.'});

        break;
    default:
        res.status(404).send(req.params.methodName + ' is not a valid users method')
        break;
    }
});

export {apiUserRouter};