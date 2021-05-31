import express, {Request, Response, Router, NextFunction, json} from 'express';
import fs from 'fs';
import path, { ParsedPath } from 'path';
import sharp, { OutputInfo, Sharp } from 'sharp';
import {promisify} from 'util';

import AuthHelper from '../../../utilities/authHelper';
import { databaseHelper } from '../../../utilities/databaseHelper';
import PFPUploadHelper from '../../../utilities/pfpUploadHelper';

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

        const originalPath: string = req.file.path;
        const parsedOriginalPath: ParsedPath = path.parse(originalPath);
        let smallFileName: string = `${parsedOriginalPath.name}.small${parsedOriginalPath.ext}`;
        let smallFilePath: string = path.join(parsedOriginalPath.dir, smallFileName);

        try
        {
            const originalImage: Sharp = await sharp(req.file.path);
            const originalMetaData: sharp.Metadata = await originalImage.metadata();

            const originalWidth: number = originalMetaData.width || 501;
            const originalHeight: number = originalMetaData.height || 501;

            if (originalWidth > 500 || originalHeight > 500) {
                const smallPFP: OutputInfo = await sharp(req.file.path).resize({
                    width: 500,
                    height: 500,
                    fit: 'inside'
                }).toFormat('png').toFile(smallFilePath);
            }
            else {
                const copyFileAsync = promisify(fs.copyFile);

                await copyFileAsync(originalPath, smallFilePath);
            }
        }
        catch (err)
        {
            console.error(`Failed to create resized version: ${err.message}`);
            return res.status(500).json({success: false, message: 'An error has occurred while processing your profile picture'});
        }

        try
        {
            let {success, pfp, pfpSmall}: {success: Boolean, pfp?: string, pfpSmall?: string} = await databaseHelper.addProfilePictureToUser(req.file.filename, smallFileName, req.file.originalname, req.file.mimetype, req.userId!);

            if (success) {
                return res.status(200).json({success: true, message: 'Upload success!', pfp, pfpSmall});
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