import 'reflect-metadata';
import express, {Request, Response, NextFunction} from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import FileHandler from './utilities/fileHandler';

import * as Constants from './constants/constants';
import AuthHelper from './utilities/authHelper';

const app: express.Application = express();
const port: number = 3000;
const corsOptions: Object = {
    origin: Constants.BASE_API_URL
};

function send404Response (res: Response, message = 'Not Found'): any {
    res.status(404).send(message);
};

// When serving svgz, need to add the gzip Content-Encoding header so the browser knows what to do with it
// This has to come before the app.use(express.static('dist')) line
app.use(/.*\.svgz$/, (req: Request, res: Response, next: NextFunction) => {
    res.header('Content-Encoding', 'gzip');
    next();
});

// Serve static files out of the dist directory using the static middleware function
app.use(express.static('dist'));
// Parse request bodies as JSON
app.use(express.json());
// Parse url encoded request bodies, supporting qs, which allows nested objects in query strings
app.use(express.urlencoded({extended: true}));
// Set up the CORS middleware with options
app.use(cors(corsOptions));
// Set up express to parse cookies
app.use(cookieParser());
// Specify allowed headers
app.use((req: Request, res: Response, next: NextFunction) => {
    res.header(
        'Access-Control-Allow-Headers',
        'x-access-token, Origin, Content-Type, Accept'
    );
    next();
});



import {apiRouter} from './routers/api'
app.use('/api', apiRouter);

app.get(/^\/(index)?$/, (req: Request, res: Response) => {
    FileHandler.sendFileResponse(res, './dist/index.html', 'text/html');
});

app.get('/profile', [AuthHelper.verifyToken], (req: Request, res: Response) => {
    FileHandler.sendFileResponse(res, './dist/index.html', 'text/html');
});

// It may be necessary to direct everything other than api calls to index due to the single page app
app.get('*', (req: Request, res: Response) => {
    FileHandler.sendFileResponse(res, './dist/index.html', 'text/html');
});

app.use((req: Request, res: Response) => {
    send404Response(res);
});

app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
});