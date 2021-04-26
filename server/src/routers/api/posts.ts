import express, {Request, Response, Router} from 'express';
import path from 'path';

import AuthHelper from '../../utilities/authHelper';
import PostUploadHelper from '../../utilities/postUploadHelper';
import { databaseHelper } from '../../utilities/databaseHelper';
import * as ClientConstants from '../../constants/constants.client';

import { generateAudioThumbnail, generateVideoThumbnail } from '../../utilities/ffmpegHelper';

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
    case 'getPostComments':
        try {
            if (req.userId !== undefined) {
                let postUniqueId: string | undefined = req.query.postUniqueId?.toString();
                let pageNumber: number | undefined = req.query.pageNumber ? parseInt(req.query.pageNumber.toString()) : undefined;

                if (postUniqueId) {
                    let {comments, total}: {comments: WebsiteBoilerplate.PostComment[], total: number} = await databaseHelper.getCommentsForPost(req.userId, postUniqueId, pageNumber);

                    return res.status(200).json({success: true, comments, total});
                }
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
                    }));

                    if (postType === ClientConstants.POST_TYPES.VIDEO) {
                        let file: Express.Multer.File = req.files[0];
                        let thumbnailFileName: string = await generateVideoThumbnail(file.destination, file.filename);

                        postFiles[0].thumbnailFileName = thumbnailFileName;
                    }
                    else if (postType === ClientConstants.POST_TYPES.AUDIO) {
                        let file: Express.Multer.File = req.files[0];
                        let thumbnailFileName: string = await generateAudioThumbnail(file.destination, file.filename);

                        postFiles[0].thumbnailFileName = thumbnailFileName;
                    }
                }

                await databaseHelper.addNewPost(req.userId, postType, postTitle, postText, audience, customAudience, postFiles);
                return res.status(200).json({success: true});
            }

            return res.status(200).json({success: false});
        }
        catch (err) {
            console.error(err.message);
            return res.status(500);
        }
    case 'createNewPostComment': {
        try {
            if (req.userId) {
                let { postUniqueId, commentText, parentCommentUniqueId}: { postUniqueId: string | undefined, commentText: string | undefined, parentCommentUniqueId: string | undefined} = req.body;

                if (postUniqueId && commentText && commentText.length <= 500) {
                    await databaseHelper.addNewPostComment(req.userId, postUniqueId, commentText, parentCommentUniqueId);

                    return res.status(200).json({success: true});                    
                }
            }

            return res.status(200).json({success: false});
        }
        catch (err) {
            console.error(err.message);
            return res.status(500);
        }
        break;
    }
    default:
        res.status(404).send(req.params.methodName + ' is not a valid posts method.');
        break;
    }
});

export {apiPostsRouter};