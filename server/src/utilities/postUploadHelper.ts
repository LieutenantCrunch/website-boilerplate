import express from 'express';
import multer from 'multer';
import * as ClientConstants from '../constants/constants.client';
import FileHandler from '../utilities/fileHandler';

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
                            FileHandler.createDirectoryIfNotExists(`${process.cwd()}/dist/i/u/${req.userId!}/i`).then(() => {
                                cb(null, `${process.cwd()}/dist/i/u/${req.userId!}/i`);
                            });
                            
                            break;
                        case ClientConstants.POST_TYPES.VIDEO:
                            FileHandler.createDirectoryIfNotExists(`${process.cwd()}/dist/i/u/${req.userId!}/v`).then(() => {
                                cb(null, `${process.cwd()}/dist/i/u/${req.userId!}/v`);
                            });
                        
                            break;
                        case ClientConstants.POST_TYPES.AUDIO:
                            FileHandler.createDirectoryIfNotExists(`${process.cwd()}/dist/i/u/${req.userId!}/a`).then(() => {
                                cb(null, `${process.cwd()}/dist/i/u/${req.userId!}/a`);
                            });
                        
                            break;
                        default:
                            FileHandler.createDirectoryIfNotExists(`${process.cwd()}/dist/i/u/${req.userId!}`).then(() => {
                                cb(null, `${process.cwd()}/dist/i/u/${req.userId!}`);
                            });
                        
                            break;
                    }
                }
                else {
                    cb(null, `${process.cwd()}/dist/i/u/${req.userId!}`);
                }
            }
            catch (err) {
                cb(new Error(`Error determining post destination, falling back to default:${err.message}`), `${process.cwd()}/dist/i/u/${req.userId!}`);
            }
        },
        filename: (req: express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
            cb(null, `${Date.now()}.${file.originalname}`);
        }
    })

    private static fileFilter(req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
        let errorMessage: string | null = null;

        console.log('hello anybody home');
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

    static uploader = multer({storage: PostUploadHelper.storage, fileFilter: PostUploadHelper.fileFilter});
}