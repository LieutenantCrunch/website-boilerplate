import express, {Request, Response} from 'express'

const app: express.Application = express();
const port: number = 3000;

app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!');
});

app.get('/:test', (req: Request, res: Response) => {
    res.send(`Hello ${req.param('test', 'World.')}!`);
});

app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
})