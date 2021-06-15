import express, {Request, Response} from 'express';
import AuthHelper from '../../../utilities/authHelper';

import { dbMethods } from '../../../database/dbMethods';
import { adjustGUIDDashes } from '../../../utilities/utilityFunctions';

const apiPostsPublicRouter = express.Router();

apiPostsPublicRouter.get('/:methodName', [AuthHelper.verifyTokenAndPassThrough], async (req: Request, res: Response) => {
    switch (req.params.methodName)
    {
    case 'getUserPosts':
        try {
            let userUniqueId: string | undefined = req.userId;
            let postedByUniqueId: string | undefined = req.query.postedByUniqueId ? req.query.postedByUniqueId.toString() : undefined;
            let pageNumber: number | undefined = req.query.pageNumber ? parseInt(req.query.pageNumber.toString()) : undefined;
            let endDate: Date | undefined = undefined;
            let profileName: string | undefined = req.query.profileName ? req.query.profileName.toString() : undefined;

            
            try
            {
                endDate = req.query.endDate ? new Date(parseInt(req.query.endDate.toString())) : undefined;
            }
            catch (err) {

            }

            if (postedByUniqueId) {
                let {posts, total} : {posts: WebsiteBoilerplate.Post[], total: number} = await dbMethods.Posts.getPostsByUser(userUniqueId, postedByUniqueId, undefined, null, endDate, pageNumber);

                return res.status(200).json({success: true, posts, total});
            }
            else if (profileName) {
                let {posts, total} : {posts: WebsiteBoilerplate.Post[], total: number} = await dbMethods.Posts.getPostsByUser(userUniqueId, undefined, profileName, null, endDate, pageNumber);

                return res.status(200).json({success: true, posts, total});
            }
        }
        catch (err) {
            console.error(`Error during getUserPosts:\n${err.message}`);
        }

        return res.status(200).json({success: false});
    case 'getPost': {
        try {
            let userUniqueId: string | undefined = req.userId;
            let postId: string | undefined = req.query.postId ? req.query.postId.toString() : undefined;
            let commentId: string | undefined = req.query.commentId ? req.query.commentId.toString() : undefined;

            if (postId) {
                let postUniqueId: string | undefined = adjustGUIDDashes(postId, true);
                let commentUniqueId: string | undefined = commentId ? adjustGUIDDashes(commentId, true) : undefined;

                if (postUniqueId) {
                    let post: WebsiteBoilerplate.Post | undefined = await dbMethods.Posts.getPost(userUniqueId, postUniqueId, commentUniqueId);

                    if (post) {
                        return res.status(200).json({ success: true, post });
                    }
                }
            }
        }
        catch (err) {
            console.error(`Error during getPost:\n${err.message}`);
        }

        return res.status(200).json({success: false});
    }
    default:
        res.status(404).json({success: false, path: null, message: `${req.params.methodName} is not a valid user PFP method`});
        break;
    }
});

export {apiPostsPublicRouter};
