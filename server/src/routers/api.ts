import express, {Request, Response, Router, NextFunction} from 'express';

import {apiUserRouter} from './api/users';
import {apiAuthRouter} from './api/auth';

const apiRouter = express.Router();

apiRouter.use('/users', apiUserRouter);
apiRouter.use('/auth', apiAuthRouter);

apiRouter.get('/:methodName', async (req: Request, res: Response) => {
    switch (req.params.methodName)
    {
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