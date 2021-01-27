import express, {Request, Response, Router, NextFunction} from 'express';

import {apiUserRouter} from './api/users';
import {apiAuthRouter} from './api/auth';

import * as Constants from '../constants/constants';

const apiRouter = express.Router();

apiRouter.use('/users', apiUserRouter);
apiRouter.use('/auth', apiAuthRouter);

apiRouter.get('/:methodName', async (req: Request, res: Response) => {
    switch (req.params.methodName)
    {
    case 'getConstants':
        res.status(200).json({
            DisplayNameChangeDays: Constants.DISPLAY_NAME_CHANGE_DAYS,
            ProfileNameRegexDetails: {
                Pattern: Constants.PROFILE_NAME_REGEX_PATTERN,
                Flags: Constants.PROFILE_NAME_REGEX_FLAGS
            },
            URLs: {
                BASE_URL: Constants.BASE_URL,
                BASE_API_URL: Constants.BASE_API_URL,
                BASE_USERS_URL: Constants.BASE_USERS_URL
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