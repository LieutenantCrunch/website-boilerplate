import express, {Request, Response, Router} from 'express';

import AuthHelper from '../../utilities/authHelper';
import PostUploadHelper from '../../utilities/postUploadHelper';
import { databaseHelper } from '../../utilities/databaseHelper';
import * as ClientConstants from '../../constants/constants.client';

const apiPostsRouter: Router = express.Router();

apiPostsRouter.get('/:methodName', [AuthHelper.verifyToken], async (req: Request, res: Response) => {
    switch (req.params.methodName)
    {
    case 'getFeed':
        try {
            if (req.userId !== undefined) {               
                let {posts, total} : {posts: WebsiteBoilerplate.Post[], total: number} = await databaseHelper.getFeed(req.userId, null, null, null);

                return res.status(200).json({success: true, posts, total});
            }
        }
        catch (err) {
            console.error(err.message);
        }

        return res.status(200).json({success: false});
    default:
        res.status(404).send(req.params.methodName + ' is not a valid users method')
        break;
    }
});

apiPostsRouter.post('/:methodName', [AuthHelper.verifyToken, PostUploadHelper.uploader.array('postFiles')], async (req: Request, res: Response) => {
    switch (req.params.methodName)
    {
    case 'createNewPost':
        try {
            if (req.userId) {
                let { postType: postTypeString, postTitle, postText, audience: audienceString, customAudience}: { postType: string | undefined, postTitle: string | undefined, postText: string | undefined, audience: string | undefined, customAudience: string | undefined} = req.body;

                let postType: number = ClientConstants.POST_TYPES.TEXT;

                if (postTypeString) {
                    try { postType = parseInt(postTypeString); } catch (err) {}
                }

                let audience: number = ClientConstants.POST_AUDIENCES.CONNECTIONS;

                if (audienceString) {
                    try { audience = parseInt(audienceString); } catch (err) {}
                }

                let postFiles: WebsiteBoilerplate.PostFileInfo[] | undefined = undefined;

                if (req.files && Array.isArray(req.files) && req.files.length > 0) {
                    postFiles = req.files.map(file => ({
                        fileName: file.filename,
                        mimeType: file.mimetype,
                        originalFileName: file.originalname,
                        size: file.size
                    }))
                }

                await databaseHelper.addNewPost(req.userId, postType, postTitle, postText, audience, customAudience, postFiles);
                return res.status(200).json({success: true});
            }
        }
        catch (err) {
            console.error(err.message);
            return res.status(500);
        }
    default:
        res.status(404).send(req.params.methodName + ' is not a valid posts method.');
        break;
    }
});

export {apiPostsRouter};