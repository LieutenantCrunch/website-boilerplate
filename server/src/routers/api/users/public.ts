import express, {Request, Response} from 'express';
import AuthHelper from '../../../utilities/authHelper';

import { databaseHelper } from '../../../utilities/databaseHelper';

const apiUserPublicRouter = express.Router();

apiUserPublicRouter.get('/:methodName', [AuthHelper.verifyTokenAndPassThrough], async (req: Request, res: Response) => {
    switch (req.params.methodName)
    {
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
    default:
        res.status(404).json({success: false, path: null, message: `${req.params.methodName} is not a valid user PFP method`});
        break;
    }
});

export {apiUserPublicRouter};