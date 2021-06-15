import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, {Request, Response, NextFunction} from 'express';
import * as http from 'http';
import path from 'path';
import * as SocketIO from 'socket.io';

import * as ClientConstants from './constants/constants.client';
import * as ServerConstants from './constants/constants.server';

import { models } from './models/_index';

import AuthHelper from './utilities/authHelper';
import FileHandler from './utilities/fileHandler';
import { socketCache } from './utilities/socketCache';

const app: express.Application = express();
const server: http.Server = http.createServer(app);
const io: SocketIO.Server = new SocketIO.Server();

io.attach(server, { cookie: false });

const corsOptions: Object = {
    origin: ClientConstants.BASE_API_URL
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
app.use('/public', express.static(path.resolve(__dirname, '../dist')));
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

import {apiRouter} from './routers/api';
app.use('/api', apiRouter);

import {usersRouter} from './routers/users';
app.use('/u', usersRouter);

app.get(/^\/admin$/, [AuthHelper.verifyToken, AuthHelper.verifyAdmin], (req: Request, res: Response) => {
    FileHandler.sendFileResponse(res, './dist/admin.html');
});

app.get(/^\/(index)?$/, (req: Request, res: Response) => {
    FileHandler.sendFileResponse(res, './dist/index.html');
});

app.get('/feed', [AuthHelper.verifyToken], (req: Request, res: Response) => {
    FileHandler.sendFileResponse(res, './dist/index.html');
});

app.get('/profile', [AuthHelper.verifyTokenAndPassThrough], (req: Request, res: Response) => {
    FileHandler.sendFileResponse(res, './dist/index.html');
});

app.get('/view-post', [AuthHelper.verifyTokenAndPassThrough], (req: Request, res: Response) => {
    FileHandler.sendFileResponse(res, './dist/index.html');
});

// It may be necessary to direct everything other than api calls to index due to the single page app
app.get('*', (req: Request, res: Response) => {
    FileHandler.sendFileResponse(res, './dist/index.html');
});

app.use((req: Request, res: Response) => {
    send404Response(res);
});

io.use(AuthHelper.verifySocketToken);

io.on('connection', (socket: SocketIO.Socket) => {
    console.log(`${socket.id} connected`);

    // socket.server.sockets.sockets
    socket.on('disconnect', () => {
        let success: Boolean = socketCache.deleteSocket(socket.id);

        console.log(`${socket.id} disconnected, socket deleted: ${success}`);
    });
});

models.sequelize.authenticate().then(() => {
    console.log(`Successfully connected to database via Sequelize.`);

    // Don't start listening unless we have a successful database connection
    server.listen(ServerConstants.LISTEN_PORT, () => {
        console.log(`Listening on http://localhost:${ServerConstants.LISTEN_PORT}`);
    });
}).catch((err: Error) => {
    console.error(`Unable to connect to the database: ${err.message}`);
    process.exit(1);
});
