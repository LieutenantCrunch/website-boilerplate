import express, {Request, Response, Router, NextFunction} from 'express';

import {apiAuthRouter} from './api/auth';
import { apiPostsRouter } from './api/posts';
import {apiUserRouter} from './api/users';

import * as ClientConstants from '../constants/constants.client';

const apiRouter = express.Router();

apiRouter.use('/auth', apiAuthRouter);
apiRouter.use('/posts', apiPostsRouter);
apiRouter.use('/users', apiUserRouter);

apiRouter.get('/:methodName', async (req: Request, res: Response) => {
    switch (req.params.methodName)
    {
    case 'getConstants':
        res.status(200).json({
            DisplayNameChangeDays: ClientConstants.DISPLAY_NAME_CHANGE_DAYS,
            ProfileNameRegexDetails: {
                Pattern: ClientConstants.PROFILE_NAME_REGEX_PATTERN,
                Flags: ClientConstants.PROFILE_NAME_REGEX_FLAGS
            },
            URLs: {
                BASE_URL: ClientConstants.BASE_URL,
                BASE_API_URL: ClientConstants.BASE_API_URL,
                BASE_USERS_URL: ClientConstants.BASE_USERS_URL
            }
        });
        break;
    default:
        res.status(404).send(req.params.methodName + ' is not a valid GET method');
        break;
    }
});

apiRouter.post('/:methodName', async (req: Request, res: Response) => {
    switch (req.params.methodName)
    {
    default:
        res.status(404).send(req.params.methodName + ' is not a valid POST method');
        break;
    }
});

export {apiRouter};