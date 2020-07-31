import express, { Response } from 'express'; // Necessary to import express, otherwise Response won't resolve
import fs from 'fs';

export default class FileHandler {
    /**
     * Sends a file down on the response passed in or writes an error if the file cannot be read
     * @param res A response object corresponding to a request made to the server
     * @param filepath A filepath that fs.readFile will understand
     * @param filetype The mime type of the file being sent
     */
    static sendFileResponse(res: Response, filepath: string, filetype: string) {
        fs.readFile(filepath, (err: NodeJS.ErrnoException | null, data: Buffer) => {
            if (err) {
                this._sendError(res, err);
            }
            else {
                this._sendFile(res, data, filetype);
            }

            res.end();
        });
    }

    private static _sendError(res: Response, err: NodeJS.ErrnoException) {
        res.writeHead(400, {'Content-Type': 'text/html'});
        res.write('Failed to read file: ' + err.message);
    }

    private static _sendFile(res: Response, data: Buffer, filetype: string) {
        res.writeHead(200, {'Content-Type': filetype});
        res.write(data);
    }
}