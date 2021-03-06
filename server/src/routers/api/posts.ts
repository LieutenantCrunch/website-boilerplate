import express, {Request, Response, Router} from 'express';

import { dbMethods } from '../../database/dbMethods';
import AuthHelper from '../../utilities/authHelper';
import { NSFWJSHelper } from '../../utilities/nsfwjsHelper';
import PostUploadHelper from '../../utilities/postUploadHelper';
import { dateFromInput } from '../../utilities/utilityFunctions';
import * as ClientConstants from '../../constants/constants.client';
import FileHandler from '../../utilities/fileHandler';
import { apiPostsPublicRouter } from './posts/public';

const apiPostsRouter: Router = express.Router();

apiPostsRouter.use('/public', apiPostsPublicRouter);

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
                    endDate = req.query.endDate ? dateFromInput(req.query.endDate.toString()) : undefined;
                }
                catch (err) {

                }

                let {posts, total, returnPostType} : {posts: WebsiteBoilerplate.Post[], total: number, returnPostType: number} = await dbMethods.Posts.getFeed(req.userId, postType, endDate, pageNumber);

                return res.status(200).json({success: true, posts, total, returnPostType});
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
                    endDate = req.query.endDate ? dateFromInput(req.query.endDate.toString()) : undefined;
                }
                catch (err) {

                }

                let {posts, total} : {posts: WebsiteBoilerplate.Post[], total: number} = await dbMethods.Posts.getPostsByUser(req.userId, req.userId, undefined, null, endDate, pageNumber);

                return res.status(200).json({success: true, posts, total});
            }
        }
        catch (err) {
            console.error(`Error during getMyPosts:\n${err.message}`);
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
                    endDate = req.query.endDate ? dateFromInput(req.query.endDate.toString()) : undefined;
                }
                catch (err) {

                }

                if (postUniqueId) {
                    let {comments, total}: {comments: WebsiteBoilerplate.PostComment[], total: number} = await dbMethods.Posts.Comments.getCommentsForPost(req.userId, postUniqueId, endDate, pageNumber);

                    return res.status(200).json({success: true, comments, total});
                }
            }
            else {
                return res.status(200).json({success: true, comments: [], total: 0});
            }
        }
        catch (err) {
            console.error(err.message);
        }

        return res.status(200).json({success: false});
    case 'getPostNotifications':
        try {
            if (req.userId !== undefined) {
                let notifications: WebsiteBoilerplate.PostNotification[] = await dbMethods.Posts.Notifications.getPostNotifications(req.userId);

                return res.status(200).json({success: true, notifications});
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

                    postFiles = [];

                    for (let file of req.files) {
                        let flagType: number = 0;
                        
                        if (postType === ClientConstants.POST_TYPES.IMAGE) {
                            flagType = await NSFWJSHelper.processImage(file.path);
                        }

                        postFiles.push({
                            fileName: file.filename,
                            flagType,
                            mimeType: file.mimetype,
                            originalFileName: file.originalname,
                            size: file.size
                        });
                    }

                    if (postType === ClientConstants.POST_TYPES.AUDIO || postType === ClientConstants.POST_TYPES.VIDEO) {
                        avFile = req.files[0];
                    }
                }

                let {newPost, postId}: {newPost: WebsiteBoilerplate.Post | undefined, postId: number | undefined} = await dbMethods.Posts.addNewPost(req.userId, postType, postTitle, postText, audience, customAudience, postFiles);

                if (newPost && postId) {
                    if (avFile) {
                        PostUploadHelper.generateAndSaveThumbnail(postId, postType!, avFile);
                    }

                    return res.status(200).json({success: true, newPost});
                }
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
                    let newComment: WebsiteBoilerplate.PostComment | undefined = await dbMethods.Posts.Comments.addNewPostComment(req.userId, postUniqueId, commentText, parentCommentUniqueId);

                    if (newComment) {
                        return res.status(200).json({success: true, newComment});
                    }
                }
            }

            return res.status(200).json({success: false});
        }
        catch (err) {
            console.error(err.message);
            return res.status(500);
        }
    }
    case 'deletePost': {
        try {
            if (req.userId) {
                let { uniqueId }: { uniqueId: string | undefined } = req.body;

                if (uniqueId) {
                    let success: Boolean = await dbMethods.Posts.deletePost(req.userId, uniqueId);

                    return res.status(200).json({success});
                }
            }

            return res.status(200).json({success: false});
        }
        catch (err) {
            console.error(err.message);
            return res.status(500);
        }
    }
    case 'deletePostComment': {
        try {
            if (req.userId) {
                let { uniqueId }: { uniqueId: string | undefined } = req.body;

                if (uniqueId) {
                    let success: Boolean = await dbMethods.Posts.Comments.deletePostComment(req.userId, uniqueId);

                    return res.status(200).json({success});
                }
            }

            return res.status(200).json({success: false});
        }
        catch (err) {
            console.error(err.message);
            return res.status(500);
        }
    }
    case 'markPostNotificationsAsRead': {
        try {
            if (req.userId) {
                let { postId, endDate: endDateStr }: { postId: string | undefined, endDate: string | undefined } = req.body;

                let endDate: Date | undefined = undefined;

                if (endDateStr) {
                    try
                    {
                        endDate = dateFromInput(endDateStr);
                    }
                    catch (err) {

                    }
                }

                if (postId) {
                    dbMethods.Posts.Notifications.markPostNotificationsAsRead(req.userId, postId, endDate);

                    return res.status(200).json({success: true});
                }
            }

            return res.status(200).json({success: false});
        }
        catch (err) {
            console.error(err.message);
            return res.status(500);
        }
    }
    case 'markAllPostNotificationsAsSeen': {
        try {
            if (req.userId) {
                let { endDate: endDateStr }: { endDate: string | undefined } = req.body;

                let endDate: Date | undefined = undefined;

                if (endDateStr) {
                    try
                    {
                        endDate = dateFromInput(endDateStr);
                    }
                    catch (err) {

                    }
                }

                dbMethods.Posts.Notifications.markAllPostNotificationsAsSeen(req.userId, endDate);

                return res.status(200).json({success: true});
            }

            return res.status(200).json({success: false});
        }
        catch (err) {
            console.error(err.message);
            return res.status(500);
        }
    }
    case 'removePostNotifications': {
        try {
            if (req.userId) {
                let { postId, endDate: endDateStr }: { postId: string | undefined, endDate: string | undefined } = req.body;

                let endDate: Date | undefined = undefined;

                if (endDateStr) {
                    try
                    {
                        endDate = dateFromInput(endDateStr);
                    }
                    catch (err) {

                    }
                }

                if (postId) {
                    dbMethods.Posts.Notifications.removePostNotifications(req.userId, postId, endDate);

                    return res.status(200).json({success: true});
                }
            }

            return res.status(200).json({success: false});
        }
        catch (err) {
            console.error(err.message);
            return res.status(500);
        }
    }
    case 'removeAllPostNotifications': {
        try {
            if (req.userId) {
                let { endDate: endDateStr }: { endDate: string | undefined } = req.body;

                let endDate: Date | undefined = undefined;

                if (endDateStr) {
                    try
                    {
                        endDate = dateFromInput(endDateStr);
                    }
                    catch (err) {

                    }
                }

                if (endDate) {
                    dbMethods.Posts.Notifications.removeAllPostNotifications(req.userId, endDate);

                    return res.status(200).json({success: true});
                }
            }

            return res.status(200).json({success: false});
        }
        catch (err) {
            console.error(err.message);
            return res.status(500);
        }
    }
    default:
        res.status(404).send(req.params.methodName + ' is not a valid posts method.');
        break;
    }
});

export {apiPostsRouter};