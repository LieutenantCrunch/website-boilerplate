import express from 'express';
import multer from 'multer';
import * as ClientConstants from '../constants/constants.client';
import { dbMethods } from '../database/dbMethods';
import FileHandler from './fileHandler';

import { generateAudioThumbnail, generateVideoThumbnail } from './ffmpegHelper';

export default class PostUploadHelper {
    private static storage: multer.StorageEngine = multer.diskStorage({
        destination: (req: express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
            try
            {
                let { postType } = req.body;

                if (postType) {
                    let postTypeInt: number = parseInt(postType);

                    switch (postTypeInt) {
                        case ClientConstants.POST_TYPES.IMAGE:
                            FileHandler.createDirectoryIfNotExists(`${process.cwd()}/dist/u/${req.userId!}/i`).then(() => {
                                cb(null, `${process.cwd()}/dist/u/${req.userId!}/i`);
                            });
                            
                            break;
                        case ClientConstants.POST_TYPES.VIDEO:
                            FileHandler.createDirectoryIfNotExists(`${process.cwd()}/dist/u/${req.userId!}/v`).then(() => {
                                cb(null, `${process.cwd()}/dist/u/${req.userId!}/v`);
                            });
                        
                            break;
                        case ClientConstants.POST_TYPES.AUDIO:
                            FileHandler.createDirectoryIfNotExists(`${process.cwd()}/dist/u/${req.userId!}/a`).then(() => {
                                cb(null, `${process.cwd()}/dist/u/${req.userId!}/a`);
                            });
                        
                            break;
                        default:
                            FileHandler.createDirectoryIfNotExists(`${process.cwd()}/dist/u/${req.userId!}`).then(() => {
                                cb(null, `${process.cwd()}/dist/u/${req.userId!}`);
                            });
                        
                            break;
                    }
                }
                else {
                    cb(null, `${process.cwd()}/dist/u/${req.userId!}`);
                }
            }
            catch (err) {
                cb(new Error(`Error determining post destination, falling back to default:${err.message}`), `${process.cwd()}/dist/u/${req.userId!}`);
            }
        },
        filename: (req: express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
            cb(null, `${Date.now()}.${file.originalname}`);
        }
    })

    private static fileFilter(req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
        let errorMessage: string | null = null;

        try {
            let { postType } = req.body;

            if (postType) {
                let postTypeInt: number = parseInt(postType);

                switch (postTypeInt) {
                    case ClientConstants.POST_TYPES.IMAGE: {
                            if (file.mimetype.startsWith('image')) {
                                cb(null, true);
                            }
                            else {
                                errorMessage = 'Only images are accepted';
                            }
                        }
                        break;
                    case ClientConstants.POST_TYPES.VIDEO: {
                            if (file.mimetype.startsWith('video')) {
                                cb(null, true);
                            }
                            else {
                                errorMessage = 'Only videos are accepted';
                            }
                        }
                        break;
                    case ClientConstants.POST_TYPES.AUDIO: {
                            if (file.mimetype.startsWith('audio')) {
                                cb(null, true);
                            }
                            else {
                                errorMessage = 'Only audio is accepted';
                            }
                        }
                        break;
                    default:
                        errorMessage = 'Unrecognized post type';
                }
            }
            else {
                errorMessage = 'Post body or type not found';
            }
        }
        catch (err) {
            errorMessage = err.message;
        }

        if (errorMessage) {
            cb(null, false);
            cb(new Error(errorMessage));
        }
    }

    static uploader = multer({
        storage: PostUploadHelper.storage, 
        fileFilter: PostUploadHelper.fileFilter,
        limits: {
            fields: 20, /* Shouldn't have more than this on a post */
            fieldSize: 2048, /* Maximum post text length plus a couple extra because why not */
            files: 4, /* Maximum of 4 files in one post when the type is image */
            fileSize: ClientConstants.MAX_UPLOAD_SIZE * 1024 * 1024
        }
    });

    static async generateAndSaveThumbnail(postId: number, postType: number, file: Express.Multer.File) {
        if (postType === ClientConstants.POST_TYPES.VIDEO || postType === ClientConstants.POST_TYPES.AUDIO) {
            let thumbnailFileName: string | undefined = undefined;

            try {
                if (postType === ClientConstants.POST_TYPES.VIDEO) {
                    thumbnailFileName = await generateVideoThumbnail(file.destination, file.filename);
                }
                else if (postType === ClientConstants.POST_TYPES.AUDIO) {
                    thumbnailFileName = await generateAudioThumbnail(file.destination, file.filename);
                }
            }
            catch (err) {
                console.error(`Error generating thumbnail:\n${err.message}`);
            }

            if (thumbnailFileName) {
                dbMethods.Posts.Files.updateThumbnailForPostFile(postId, thumbnailFileName);
            }
        }
    }
}
