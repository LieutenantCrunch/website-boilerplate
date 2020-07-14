import 'reflect-metadata';
import express, {Request, Response} from 'express';
import {createConnection, Any, Connection, Repository} from 'typeorm';

import fs from 'fs';
import path from 'path';

import {User} from './entity/User';
import FileHandler from './utilities/filehandler'

const app: express.Application = express();
const port: number = 3000;
var dbConnection: Connection;
const fileHandler: FileHandler = new FileHandler();

function send404Response (res: Response, message = 'Not Found'): any {
    res.status(404).send(message);
};

// Serve static files out of the dist directory using the static middleware function
app.use(express.static('dist'));

app.get('/api/users/:methodName', async (req: Request, res: Response) => {
    switch (req.params.methodName)
    {
    case 'list':
        if (dbConnection === undefined || dbConnection === null) {
            res.send('No database connection found');
        }
    
        let userRepository: Repository<User> = dbConnection.getRepository(User);
        let allUsers: User[] = await userRepository.find();
    
        res.writeHead(200, {'Content-Type': 'text/html'});
    
        allUsers.forEach((user: User) => {
            res.write(user.displayName);
        });
    
        res.end();
        break;
    default:
        send404Response(res, req.params.methodName + ' is not a valid users method');
        break;
    }
});

app.get('/api/:methodName', async (req: Request, res: Response) => {
    switch (req.params.methodName)
    {
    case 'check-db':
        fs.readFile('./private/dbpass.txt', 'utf8', (readFileError: NodeJS.ErrnoException | null, data: string) => {
            if (readFileError) {
                console.error(readFileError);
                res.send('Couldn\'t find the password');
            }
    
            createConnection({
                type: 'mysql',
                host: 'localhost',
                port: 3306,
                username: 'nodejs',
                password: data.trim(),
                database: 'scrapbook_dev',
                synchronize: true,
                logging: false,
                entities: [
                    __dirname + '/entity/*.js'
                ]
            }).then((connection: Connection) => {
                dbConnection = connection;
                res.send('Successfully connected to database');
            }).catch((error: any) => {
                console.error(error);
                res.send('Couldn\'t connect to the database');
            });
        })
        break;
    default:
        send404Response(res, req.params.methodName + ' is not a valid method');
        break;
    }
});

app.get(/^\/(index)?$/, (req: Request, res: Response) => {
    fileHandler.sendFileResponse(res, './dist/index.html', 'text/html');
});

// It may be necessary to direct everything other than api calls to index due to the single page app
app.get('*', (req: Request, res: Response) => {
    fileHandler.sendFileResponse(res, './dist/index.html', 'text/html');
});

app.post('/api/users/:methodName', async (req: Request, res: Response) => {
    switch (req.params.methodName)
    {
    case 'register':
        res.status(200).json({
            success: true
        });
        break;
    case 'login':
        res.status(200).json({
            success: true
        })
        break;
    default:
        send404Response(res, req.params.methodName + ' is not a valid users method');
        break;
    }
});

app.post('/api/:methodName', async (req: Request, res: Response) => {
    switch (req.params.methodName)
    {
    default:
        send404Response(res, req.params.methodName + ' is not a valid method');
        break;
    }
});

app.use((req: Request, res: Response) => {
    send404Response(res);
});

app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
});