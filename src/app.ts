import 'reflect-metadata';
import express, {Request, Response} from 'express';
import {createConnection, Any, Connection, Repository} from 'typeorm';
import fs from 'fs';
import {User} from './entity/User';

const app: express.Application = express();
const port: number = 3000;
var dbConnection: Connection;

app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!');
});

app.get('/checkdb', (req: Request, res: Response) => {
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
});

app.get('/listusers', async (req: Request, res: Response) => {
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
});

app.get('/:test', (req: Request, res: Response) => {
    res.send(`Hello ${req.param('test', 'World.')}!`);
});

app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
});