import express, {Request, Response, Router, NextFunction, json} from 'express';

import AuthHelper from '../../../utilities/authHelper';
import DatabaseHelper from '../../../utilities/databaseHelper';
import PFPUploadHelper from '../../../utilities/pfpUploadHelper';

const databaseHelper: DatabaseHelper = new DatabaseHelper();

const apiUserPFPRouter = express.Router();

apiUserPFPRouter.get('/:methodName', [AuthHelper.verifyToken], async (req: Request, res: Response) => {
    switch (req.params.methodName)
    {
    case 'get':
        if (req.userId) {
            
            const pfpFileName: string | null = await databaseHelper.getPFPFileNameForUserId(req.userId);

            if (pfpFileName) {
                res.status(200).json({success: true, path: `i/u/${req.userId}/${pfpFileName}`, message: null});
            }
            else {
                res.status(200).json({success: false, path: `i/s/pfpDefault.svgz`, message: null});
            }
        }
        break;
    default:
        res.status(404).json({success: false, path: null, message: `${req.params.methodName} is not a valid user PFP method`});
        break;
    }
});

// The parameter to uploader.single has to be the name of the form field
apiUserPFPRouter.post('/:methodName', [AuthHelper.verifyToken, PFPUploadHelper.uploader.single('pfp')], async (req: Request, res: Response) => {
    switch (req.params.methodName)
    {
    case 'upload':
        if (req.file === undefined) {
            return res.status(200).json({success: false, message: 'You must select a photo'});
        }

        try
        {
            let uploadResults: {success: Boolean} = await databaseHelper.addProfilePictureToUser(req.file.filename, req.file.originalname, req.file.mimetype, req.userId!);

            if (uploadResults.success) {
                return res.status(200).json({success: true, message: 'Upload success!'});
            }
            else {
                return res.status(500).json({success: false, message: 'An error has occurred while uploading your profile picture'});
            }

        }
        catch (err)
        {
            console.error(`Error uploading profile picture: ${err.message}`);
            return res.status(500).json({success: false, message: 'An error has occurred while uploading your profile picture'});
        }

        break;
    default:
        return res.status(404).send(req.params.methodName + ' is not a valid user PFP method')
        break;
    }
});

export {apiUserPFPRouter};