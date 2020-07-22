import 'reflect-metadata';
import express, {Request, Response, NextFunction} from 'express';
import fs from 'fs';
import {promisify} from 'util';
import cors from 'cors';
import jwt from 'jsonwebtoken';

import {User} from './entity/User';
import FileHandler from './utilities/fileHandler';
import DatabaseHelper from './utilities/databaseHelper';

import * as Constants from './constants/constants';
import AuthHelper from './utilities/authHelper';

const app: express.Application = express();
const port: number = 3000;
const corsOptions: Object = {
    origin: Constants.BASE_API_URL
};

const fileHandler: FileHandler = new FileHandler();
const databaseHelper: DatabaseHelper = new DatabaseHelper();
let jwtSecret: string = '';

async function getJWTSecret(): Promise<string> {
    const readFileAsync = promisify(fs.readFile);

    if (jwtSecret === '') {
        try
        {
            jwtSecret = (await readFileAsync('./private/jwtsecret.txt', 'utf8')).trim();
        }
        catch (readFileError)
        {
            console.error (readFileError);
        }
    }

    return jwtSecret;
}

function send404Response (res: Response, message = 'Not Found'): any {
    res.status(404).send(message);
};

// Serve static files out of the dist directory using the static middleware function
app.use(express.static('dist'));
// Parse request bodies as JSON
app.use(express.json());
// Parse url encoded request bodies, supporting qs, which allows nested objects in query strings
app.use(express.urlencoded({extended: true}));
// Set up the CORS middleware with options
app.use(cors(corsOptions));
// Specify allowed headers
app.use((req: Request, res: Response, next: NextFunction) => {
    res.header(
        'Access-Control-Allow-Headers',
        'x-access-token, Origin, Content-Type, Accept'
    );
    next();
});


app.get('/api/users/:methodName', async (req: Request, res: Response) => {
    switch (req.params.methodName)
    {
    case 'list':
        if (databaseHelper === undefined || databaseHelper === null) {
            res.send('No database connection found');
        }
    
        let allUsers: User[] = await databaseHelper.getAllUsers();
    
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
    default:
        send404Response(res, req.params.methodName + ' is not a valid method');
        break;
    }
});

app.get(/^\/(index)?$/, (req: Request, res: Response) => {
    fileHandler.sendFileResponse(res, './dist/index.html', 'text/html');
});

app.get('/profile', [AuthHelper.verifyToken], (req: Request, res: Response) => {
    fileHandler.sendFileResponse(res, './dist/index.html', 'text/html');
});

// It may be necessary to direct everything other than api calls to index due to the single page app
app.get('*', (req: Request, res: Response) => {
    fileHandler.sendFileResponse(res, './dist/index.html', 'text/html');
});

app.post('/api/auth/:methodName', async (req: Request, res: Response) => {
    switch (req.params.methodName)
    {
    case 'register':
        if (!req.body) {
            res.status(200).json({success: false, message: 'You must provide registration info'});
        }
        else {
            let canContinue: Boolean = true;

            if (req.body.email) {
                let email: string = req.body.email;
                let userExists: Boolean = await databaseHelper.userExistsForEmail(email);

                if (userExists) {
                    canContinue = false;
                    res.status(200).json({success: false, message: 'That email address is already in use'});
                }
            }
            else {
                canContinue = false;
                res.status(200).json({success: false, message: 'You must provide an email address'});
            }

            if (canContinue) {
                if (req.body.password && req.body.confirmPassword && req.body.password === req.body.confirmPassword) {
                    // Validate password strength
                    let registerResults: {id: string | null, success: Boolean} = await databaseHelper.registerNewUser(req.body.email, req.body.password);
                    
                    if (registerResults.success) {
                        res.status(200).json({success: true, message: 'Registration success! You can now log in'});
                    }
                    else {
                        res.status(200).json({success: false, message: 'An error occurred during registration'});
                    }
                }
                else {
                    res.status(200).json({success: false, message: 'Your passwords did not match'});
                }
            }
        }
        break;
    case 'login':
        if (!req.body) {
            res.status(200).json({success: false, message: 'You must provide valid credentials'});
        }
        else {
            if (req.body.email && req.body.password) {
                let loginResults: {id: string | null, success: Boolean} = await databaseHelper.validateCredentials(req.body.email, req.body.password);

                if (loginResults.success) {
                    let userID: string | null = loginResults.id;
                    let secret: string = await getJWTSecret();
                    let authToken: string = jwt.sign({id: userID}, secret); /* Could pass in options on the third parameter */

                    res.status(200).json({success: true, message: 'Login successful', userInfo: {authToken: authToken}});
                }
                else {
                    let userID: string | null = loginResults.id;
                    res.status(200).json({success: false, message: 'The credentials provided are not valid'});
                }
            }
            else {
                res.status(200).json({success: false, message: 'You must provide a valid email address and password'});
            }
        }
        break;
    default:
        send404Response(res, req.params.methodName + ' is not a valid auth method');
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