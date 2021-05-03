import express, {Request, Response, Router} from 'express';
import path from 'path';

import AuthHelper from '../../utilities/authHelper';
import PostUploadHelper from '../../utilities/postUploadHelper';
import { databaseHelper } from '../../utilities/databaseHelper';
import * as ClientConstants from '../../constants/constants.client';

import { generateAudioThumbnail, generateVideoThumbnail } from '../../utilities/ffmpegHelper';
import FileHandler from '../../utilities/fileHandler';

const apiPostsRouter: Router = express.Router();

apiPostsRouter.get('/:methodName', [AuthHelper.verifyToken], async (req: Request, res: Response) => {
    switch (req.params.methodName)
    {
    case 'getFeed':
        try {
            if (req.userId !== undefined) {               
                let pageNumber: number | undefined = req.query.pageNumber ? parseInt(req.query.pageNumber.toString()) : undefined;
                let endDate: Date | undefined = undefined;
                let postType: number | undefined = req.query.postType ? parseInt(req.query.postType.toString()) : undefined;
                
                try
                {
                    endDate = req.query.endDate ? new Date(parseInt(req.query.endDate.toString())) : undefined;
                }
                catch (err) {

                }

                let {posts, total} : {posts: WebsiteBoilerplate.Post[], total: number} = await databaseHelper.getFeed(req.userId, postType, endDate, pageNumber);

                return res.status(200).json({success: true, posts, total});
            }
        }
        catch (err) {
            console.error(err.message);
        }

        return res.status(200).json({success: false});
    case 'getMyPosts':
        try {
            if (req.userId !== undefined) {
                let pageNumber: number | undefined = req.query.pageNumber ? parseInt(req.query.pageNumber.toString()) : undefined;
                let endDate: Date | undefined = undefined;
                
                try
                {
                    endDate = req.query.endDate ? new Date(parseInt(req.query.endDate.toString())) : undefined;
                }
                catch (err) {

                }

                let {posts, total} : {posts: WebsiteBoilerplate.Post[], total: number} = await databaseHelper.getPostsForUser(req.userId, null, endDate, pageNumber);

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
                let endDate: Date | undefined = undefined;
                
                try
                {
                    endDate = req.query.endDate ? new Date(parseInt(req.query.endDate.toString())) : undefined;
                }
                catch (err) {

                }

                if (postUniqueId) {
                    let {comments, total}: {comments: WebsiteBoilerplate.PostComment[], total: number} = await databaseHelper.getCommentsForPost(req.userId, postUniqueId, endDate, pageNumber);

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

// Note: Posts are currently limited to 20 fields (see the limits on multer in postUploadHelper)
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
                let avFile: Express.Multer.File | undefined = undefined;

                if (req.files && Array.isArray(req.files) && req.files.length > 0) {
                    let totalFileSize: number = req.files.reduce((total, currentFile) => (total + currentFile.size), 0);

                    if (totalFileSize > ClientConstants.MAX_UPLOAD_SIZE * 1024 * 1024) {
                        FileHandler.deleteAllFiles(req.files);

                        return res.status(200).json({success: false});
                    }

                    postFiles = req.files.map(file => ({
                        fileName: file.filename,
                        mimeType: file.mimetype,
                        originalFileName: file.originalname,
                        size: file.size
                    }));

                    if (postType === ClientConstants.POST_TYPES.AUDIO || postType === ClientConstants.POST_TYPES.VIDEO) {
                        avFile = req.files[0];
                    }
                }

                let {newPost, postId}: {newPost: WebsiteBoilerplate.Post | undefined, postId: number | undefined} = await databaseHelper.addNewPost(req.userId, postType, postTitle, postText, audience, customAudience, postFiles);

                if (newPost && postId) {
                    if (avFile) {
                        PostUploadHelper.generateAndSaveThumbnail(postId, postType!, avFile);
                    }
                }

                return res.status(200).json({success: true, newPost});
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