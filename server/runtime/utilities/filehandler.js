"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
class FileHandler {
    /**
     * Sends a file down on the response passed in or writes an error if the file cannot be read
     * @param res A response object corresponding to a request made to the server
     * @param filepath A filepath that fs.readFile will understand
     * @param filetype The mime type of the file being sent
     */
    static sendFileResponse(res, filepath, filetype) {
        fs_1.default.readFile(filepath, (err, data) => {
            if (err) {
                this._sendError(res, err);
            }
            else {
                this._sendFile(res, data, filetype);
            }
            res.end();
        });
    }
    static _sendError(res, err) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.write('Failed to read file: ' + err.message);
    }
    static _sendFile(res, data, filetype) {
        res.writeHead(200, { 'Content-Type': filetype });
        res.write(data);
    }
}
exports.default = FileHandler;
//# sourceMappingURL=fileHandler.js.map