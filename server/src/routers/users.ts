import express, {Request, Response} from 'express';

import FileHandler from '../utilities/fileHandler';
import * as Constants from '../constants/constants';
import { databaseHelper } from '../utilities/databaseHelper';

const usersRouter = express.Router();

usersRouter.get('/:profileName', async (req: Request, res: Response) => {
    let profileName: string = req.params.profileName;

    if ((/^[a-z]+(\.[0-9]+)?$/i).test(profileName)) {
        let result: Boolean = await databaseHelper.userExistsForProfileName(profileName);
        
        if (result) {
            console.log(`Request for ${profileName} successful`);
            FileHandler.sendFileResponse(res, './dist/index.html', 'text/html');
        }
        else {
            console.log(`Request for invalid profile: ${req.params}`);
            res.status(404).send(`Sorry, you can't view that profile.`);
        }
    }
    else {
        console.log(`Request for invalid profile: ${req.params}`);
        res.status(404).send(`Sorry, you can't view that profile.`);
    }
});

export {usersRouter};
