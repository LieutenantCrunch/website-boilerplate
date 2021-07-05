import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, {Request, Response, NextFunction} from 'express';
import fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import path from 'path';
import * as SocketIO from 'socket.io';
import args from 'args';

import * as ClientConstants from './constants/constants.client';
import * as ServerConstants from './constants/constants.server';

import { models } from './models/_index';

import AuthHelper from './utilities/authHelper';
import FileHandler from './utilities/fileHandler';
import { NSFWJSHelper } from './utilities/nsfwjsHelper';
import { socketCache } from './utilities/socketCache';

// npm run start:dev -- --ports || npm run start:dev -- -p
args.option('ports', 'Pass this argument if explicit ports are necessary in prod. Ex: No firewall routing (80->3000, 443->3443) will require redirects to addresses containing the port numbers.', false);
const flags = args.parse(process.argv);

const explicitPorts: Boolean = flags.p || flags.ports;
const isProd: Boolean = process.env.NODE_ENV === 'production';

const certificate: string = fs.readFileSync('./private/certs/localhost+3.pem', 'utf8');
const privateKey: string = fs.readFileSync('./private/certs/localhost+3-key.pem', 'utf8');

const httpApp: express.Application = express();
const httpServer: http.Server = http.createServer(httpApp);

httpApp.get(/^\/favicon\.png$/, (req: Request, res: Response) => {
    FileHandler.sendFileResponse(res, './dist/favicon.png');
});

if (isProd) {
    httpApp.get(/^\/robots\.txt$/, (req: Request, res: Response) => {
        FileHandler.sendFileResponse(res, './dist/robots.txt');
    });

    httpApp.get('*', (req: express.Request, res: express.Response, next: express.NextFunction) => {
        let portIndex: number | undefined = req.headers.host?.indexOf(':');
        let actualHost: string | undefined = req.headers.host;

        if (actualHost && portIndex && portIndex !== -1) {
            actualHost = actualHost.substring(0 , portIndex);
        }

        if (actualHost) {
            if (explicitPorts) {
                res.redirect(`https://${actualHost}:${ServerConstants.LISTEN_PORT_SECURE}${req.path}`);
            }
            else {
                res.redirect(`https://${actualHost}${req.path}`);
            }
        }
        else {
            return next();
        }
    });
}
else {
    // This is for hosting the cert so you can load it on mobile
    httpApp.get('/rootCA.pem', (req: Request, res: Response) => {
        FileHandler.sendFileResponse(res, './private/certs/rootCA.pem');
    });
}

const httpsApp: express.Application = isProd ? express() : httpApp;
const options: https.ServerOptions = {
    cert: certificate, 
    key: privateKey 
};
const httpsServer: https.Server | http.Server = isProd ? https.createServer(options, httpsApp) : httpServer;
const io: SocketIO.Server = new SocketIO.Server();

io.attach(httpsServer, { cookie: false });

const corsOptions: Object = {
    origin: ClientConstants.BASE_API_URL
};

function send404Response (res: Response, message = 'Not Found'): any {
    res.status(404).send(message);
};

if (isProd) {
    httpsApp.get(/^\/favicon\.png$/, (req: Request, res: Response) => {
        FileHandler.sendFileResponse(res, './dist/favicon.png');
    });
}

// When serving svgz, need to add the gzip Content-Encoding header so the browser knows what to do with it
// This has to come before the app.use(express.static('dist')) line
httpsApp.use(/.*\.svgz$/, (req: Request, res: Response, next: NextFunction) => {
    res.header('Content-Encoding', 'gzip');
    next();
});

// Serve static files out of the dist directory using the static middleware function
httpsApp.use('/public', express.static(path.resolve(__dirname, '../dist')));
// Parse request bodies as JSON
httpsApp.use(express.json());
// Parse url encoded request bodies, supporting qs, which allows nested objects in query strings
httpsApp.use(express.urlencoded({extended: true}));
// Set up the CORS middleware with options
httpsApp.use(cors(corsOptions));
// Set up express to parse cookies
httpsApp.use(cookieParser());
// Specify allowed headers
httpsApp.use((req: Request, res: Response, next: NextFunction) => {
    res.header(
        'Access-Control-Allow-Headers',
        'x-access-token, Origin, Content-Type, Accept'
    );
    next();
});

import {apiRouter} from './routers/api';
httpsApp.use('/api', apiRouter);

import {usersRouter} from './routers/users';
httpsApp.use('/u', usersRouter);

httpsApp.get(/^\/robots\.txt$/, (req: Request, res: Response) => {
    FileHandler.sendFileResponse(res, './dist/robots.txt');
});

httpsApp.get(/^\/admin$/, [AuthHelper.verifyToken, AuthHelper.verifyAdmin], (req: Request, res: Response) => {
    FileHandler.sendFileResponse(res, './dist/admin.html');
});

httpsApp.get(/^\/(index)?$/, (req: Request, res: Response) => {
    FileHandler.sendFileResponse(res, './dist/index.html');
});

httpsApp.get('/feed', [AuthHelper.verifyToken], (req: Request, res: Response) => {
    FileHandler.sendFileResponse(res, './dist/index.html');
});

httpsApp.get('/profile', [AuthHelper.verifyTokenAndPassThrough], (req: Request, res: Response) => {
    FileHandler.sendFileResponse(res, './dist/index.html');
});

httpsApp.get('/view-post', [AuthHelper.verifyTokenAndPassThrough], (req: Request, res: Response) => {
    FileHandler.sendFileResponse(res, './dist/index.html');
});

// It may be necessary to direct everything other than api calls to index due to the single page app
httpsApp.get('*', (req: Request, res: Response) => {
    FileHandler.sendFileResponse(res, './dist/index.html');
});

httpsApp.use((req: Request, res: Response) => {
    send404Response(res);
});

io.use(AuthHelper.verifySocketToken);

io.on('connection', (socket: SocketIO.Socket) => {
    // console.log(`${socket.id} connected`);

    // socket.server.sockets.sockets
    socket.on('disconnect', () => {
        let success: Boolean = socketCache.deleteSocket(socket.id);

        // console.log(`${socket.id} disconnected, socket deleted: ${success}`);
    });
});

models.sequelize.authenticate().then(() => {
    console.log(`Successfully connected to database via Sequelize.`);

    // Don't start listening unless we have a successful database connection

    NSFWJSHelper.load().then(() => {
        // Don't start listening unless the NSFWJS model has loaded

        if (isProd) {
            httpServer.listen(ServerConstants.LISTEN_PORT, () => {
                console.log(`Listening on port ${ServerConstants.LISTEN_PORT}`);
            });

            httpsServer.listen(ServerConstants.LISTEN_PORT_SECURE, () => {
                console.log(`Listening on port ${ServerConstants.LISTEN_PORT_SECURE}`);
            });
        }
        else {
            httpsServer.listen(ServerConstants.LISTEN_PORT, () => {
                console.log(`Listening on port ${ServerConstants.LISTEN_PORT}`);
            });
        }
    })
    .catch((err: Error) => {
        console.error(`Unable to load the NSFWJS model:\n${err.message}`);
        process.exit(1);
    })
}).catch((err: Error) => {
    console.error(`Unable to connect to the database or start listening on ports: ${err.message}`);
    process.exit(1);
});
