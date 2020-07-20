import 'reflect-metadata';
import express, {Request, Response} from 'express';

import {User} from './entity/User';
import FileHandler from './utilities/fileHandler';
import DatabaseHelper from './utilities/databaseHelper';

const app: express.Application = express();
const port: number = 3000;

const fileHandler: FileHandler = new FileHandler();
const databaseHelper: DatabaseHelper = new DatabaseHelper();

function send404Response (res: Response, message = 'Not Found'): any {
    res.status(404).send(message);
};

// Serve static files out of the dist directory using the static middleware function
app.use(express.static('dist'));
// Parse request bodies as JSON
app.use(express.json());

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

// It may be necessary to direct everything other than api calls to index due to the single page app
app.get('*', (req: Request, res: Response) => {
    fileHandler.sendFileResponse(res, './dist/index.html', 'text/html');
});

app.post('/api/users/:methodName', async (req: Request, res: Response) => {
    switch (req.params.methodName)
    {
    case 'register':
        if (!req.body) {
            res.status(204).json({success: false, message: 'You must provide registration info'});
        }
        else {
            let canContinue: Boolean = true;

            if (req.body.email) {
                let email: string = req.body.email;
                let userExists: Boolean = await databaseHelper.userExistsForEmail(email);

                if (userExists) {
                    canContinue = false;
                    res.status(204).json({success: false, message: 'That email address is already in use'});
                }
            }
            else {
                canContinue = false;
                res.status(204).json({success: false, message: 'You must provide an email address'});
            }

            if (canContinue) {
                if (req.body.password && req.body.confirmPassword && req.body.password === req.body.confirmPassword) {
                    // Validate password strength
                    let addSuccess: Boolean = await databaseHelper.registerNewUser(req.body.email, req.body.password);
                    
                    if (addSuccess) {
                        res.status(200).json({success: true, message: 'That email address is available'});
                    }
                    else {
                        res.status(204).json({success: false, message: 'An error occurred during registration'});
                    }
                }
                else {
                    res.status(204).json({success: false, message: 'Your passwords did not match'});
                }
            }
        }
        break;
    case 'login':
        if (!req.body) {
            res.status(204).json({success: false, message: 'You must provide valid credentials'});
        }
        else {
            if (req.body.email && req.body.password) {
                let loginSuccess: Boolean = await databaseHelper.validateCredentials(req.body.email, req.body.password);

                if (loginSuccess) {
                    res.status(200).json({success: true, message: 'Login successful'});
                }
                else {
                    res.status(204).json({success: false, message: 'The credentials provided are not valid'});
                }
            }
            else {
                res.status(204).json({success: false, message: 'You must provide a valid email address and password'});
            }
        }
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