import express, {Request, Response} from 'express';

import * as ClientConstants from '../constants/constants.client';
import FileHandler from '../utilities/fileHandler';
import AuthHelper from '../utilities/authHelper';
import { dbMethods } from '../database/dbMethods';

const usersRouter = express.Router();

usersRouter.get('/:profileName', [AuthHelper.verifyTokenAndPassThrough], async (req: Request, res: Response) => {
    let profileName: string = req.params.profileName;

    if (ClientConstants.PROFILE_NAME_REGEX.test(profileName)) {
        let currentUserUniqueId: string | undefined = req.userId;
        let result: {exists: Boolean, allowPublicAccess: Boolean} = await dbMethods.Users.Searches.userExistsForProfileName(currentUserUniqueId, profileName);
        
        if (result.exists && (currentUserUniqueId || result.allowPublicAccess)) {
            FileHandler.sendFileResponse(res, './dist/index.html');
        }
        else {
            res.status(404).send(`Sorry, you can't view that profile.`);
        }
    }
    else {
        res.status(404).send(`Sorry, you can't view that profile.`);
    }
});

export {usersRouter};
