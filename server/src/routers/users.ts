import express, {Request, Response} from 'express';

import * as Constants from '../constants/constants';
import FileHandler from '../utilities/fileHandler';
import AuthHelper from '../utilities/authHelper';
import { databaseHelper } from '../utilities/databaseHelper';

const usersRouter = express.Router();

usersRouter.get('/:profileName', [AuthHelper.verifyTokenAndPassThrough], async (req: Request, res: Response) => {
    let profileName: string = req.params.profileName;

    if (Constants.PROFILE_NAME_REGEX.test(profileName)) {
        let result: {exists: Boolean, allowPublicAccess: Boolean} = await databaseHelper.userExistsForProfileName(profileName);
        let currentUserId: string | undefined = req.userId;
        
        if (result.exists && (currentUserId || result.allowPublicAccess)) {
            FileHandler.sendFileResponse(res, './dist/index.html', 'text/html');
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
