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

app.get(/^\/(index)?$/, (req: Request, res: Response) => {
    fileHandler.sendFileResponse(res, './dist/index.html', 'text/html');
});

app.get(/.css$/, (req: Request, res: Response) => {
    const cssFileName: string = path.resolve('./dist', req.path.substr(1));

    fileHandler.sendFileResponse(res, cssFileName, 'text/css');
});

app.get(/\.js$/, (req: Request, res: Response) => {
    const jsFileName: string = path.resolve('./dist', req.path.substr(1));

    fileHandler.sendFileResponse(res, jsFileName, 'text/javascript');
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
    case 'list-users':
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
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.write('Not Found');
        res.end();
        break;
    }
});

app.use((req: Request, res: Response) => {
    res.writeHead(404, {'Content-Type': 'text/html'});
    res.write('Not Found');
    res.end();
});

app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
});