import express, { Response } from 'express'; // Necessary to import express, otherwise Response won't resolve
import fs from 'fs';
import path from 'path';
import { fromFile, FileTypeResult } from 'file-type';
import { lookup } from 'mime-types';
import { mkdir, unlink } from 'fs/promises';

export default class FileHandler {
    /**
     * Sends a file down on the response passed in or writes an error if the file cannot be read
     * @param res A response object corresponding to a request made to the server
     * @param filepath A filepath that fs.readFile will understand
     * @param filetype The mime type of the file being sent
     */
    static async sendFileResponse(res: Response, filepath: string) {
        try {
            let fromFileTest: FileTypeResult | undefined = await fromFile(filepath);
            let mimeType: string | undefined = undefined;
            
            if (fromFileTest === undefined) {
                let lookupTest: string | false = lookup(filepath);

                if (lookupTest) {
                    mimeType = lookupTest;
                }
            }
            else {
                mimeType = fromFileTest.mime;
            }

            if (mimeType !== undefined) {
                fs.readFile(filepath, (err: NodeJS.ErrnoException | null, data: Buffer) => {
                    if (err) {
                        this._sendError(res, err);
                    }
                    else {
                        this._sendFile(res, data, mimeType!);
                    }

                    res.end();
                });
            }
            else {
                //## Probably don't want to send down the actual error to the client
                this._sendError(res, new Error(`Failed to determine mimetype of requested file (${filepath}).`));
                res.end();
            }
        }
        catch (err) {
            //## Probably don't want to send down the actual error to the client
            this._sendError(res, new Error(`Exception while determining mimetype of requested file (${filepath}):\n${err.message}`));
            res.end();
        }
    }

    private static _sendError(res: Response, err: NodeJS.ErrnoException) {
        res.writeHead(400, {'Content-Type': 'text/html'});
        res.write('Failed to read file: ' + err.message);
        /* Do not put a res.end() here, as it will end the response before all data is sent */
    }

    private static _sendFile(res: Response, data: Buffer, filetype: string) {
        res.writeHead(200, {'Content-Type': filetype});
        res.write(data);
        /* Do not put a res.end() here, as it will end the response before all data is sent */
    }

    static async createDirectoryIfNotExists(dir: string) {
        try {
            await mkdir(dir, {
                recursive: true
            });
        }
        catch (err) {
            // Do nothing, the directory probably already existed
        }
    }

    static async deleteFile(filePath: string) {
        try {
            await unlink(filePath);
        }
        catch (err) {
            console.error(`Failed to delete file at location: ${filePath}:\n${err.message}`);
        }
    }

    static async deleteAllFiles(files: Express.Multer.File[]) {
        for (let file of files) {
            let filePath: string = path.join(file.destination, file.filename);

            this.deleteFile(filePath);
        }
    }
}