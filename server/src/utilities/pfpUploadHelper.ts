import express from 'express';
import multer from 'multer';

export default class PFPUploadHelper {
    private static storage: multer.StorageEngine = multer.diskStorage({
        destination: (req: express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
            cb(null, `${process.cwd()}/dist/u/${req.userId!}`);
        },
        filename: (req: express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
            cb(null, `${Date.now()}.${file.originalname}`);
        }
    })

    private static imageFilter(req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
        if (file.mimetype.startsWith('image')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only images are accepted'));
        }
    }

    static uploader = multer({storage: PFPUploadHelper.storage, fileFilter: PFPUploadHelper.imageFilter});
}