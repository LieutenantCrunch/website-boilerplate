import express, {Request, Response, Router} from 'express';

import AuthHelper from '../../utilities/authHelper';
import { databaseHelper } from '../../utilities/databaseHelper';

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

apiPostsRouter.post('/:methodName', [AuthHelper.verifyToken], async (req: Request, res: Response) => {
    switch (req.params.methodName)
    {
    default:
        res.status(404).send(req.params.methodName + ' is not a valid posts method.');
        break;
    }
});

export {apiPostsRouter};