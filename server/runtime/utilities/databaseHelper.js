"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const typeorm_1 = require("typeorm");
const User_1 = require("../entity/User");
class DatabaseHelper {
    constructor() {
        fs_1.default.readFile('./private/dbpass.txt', 'utf8', (readFileError, data) => {
            if (readFileError) {
                console.error(readFileError);
            }
            typeorm_1.createConnection({
                type: 'mysql',
                host: 'localhost',
                port: 3306,
                username: 'nodejs',
                password: data.trim(),
                database: 'scrapbook_dev',
                synchronize: true,
                logging: false,
                entities: [
                    path_1.default.resolve(__dirname, '../entity/*.js')
                ]
            }).then((con) => {
                this.#connection = con;
                console.log('Successfully connected to database');
            }).catch((error) => {
                console.error(error);
            });
        });
    }
    #connection;
    ;
    async getAllUsers() {
        let userRepository = this.#connection.getRepository(User_1.User);
        let allUsers = await userRepository.find();
        return allUsers;
    }
    async userExistsForEmail(email) {
        let userRepository = this.#connection.getRepository(User_1.User);
        let foundUsers = await userRepository.find({ email: email });
        return (foundUsers.length > 0);
    }
}
exports.default = DatabaseHelper;
;
//# sourceMappingURL=databaseHelper.js.map