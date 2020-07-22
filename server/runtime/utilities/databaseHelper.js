"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
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
    #userRepository;
    ;
    getUserRepository() {
        if (!this.#userRepository) {
            this.#userRepository = this.#connection.getRepository(User_1.User);
        }
        return this.#userRepository;
    }
    async getAllUsers() {
        let userRepository = this.getUserRepository();
        let allUsers = await userRepository.find();
        return allUsers;
    }
    async userExistsForEmail(email) {
        let userRepository = this.getUserRepository();
        let foundUsers = await userRepository.find({ email: email });
        return (foundUsers.length > 0);
    }
    async registerNewUser(email, password) {
        try {
            let userRepository = this.getUserRepository();
            let salt = await bcryptjs_1.default.genSalt(10);
            let hash = await bcryptjs_1.default.hash(password, salt);
            let userUUID = uuid_1.v4();
            let newUser = new User_1.User();
            newUser = { ...newUser, email: email, passwordHash: hash, uniqueID: userUUID };
            await userRepository.save(newUser);
            return { id: userUUID, success: true };
        }
        catch (err) {
            console.error(err.message);
            return { id: null, success: false };
        }
    }
    async validateCredentials(email, password) {
        try {
            let userRepository = this.getUserRepository();
            let foundUsers = await userRepository.find({ email: email });
            if (foundUsers.length === 1) {
                let user = foundUsers[0];
                let passwordHash = user.passwordHash;
                let isValid = await bcryptjs_1.default.compare(password, passwordHash);
                return { id: user.uniqueID, success: isValid };
            }
            return { id: null, success: false };
            ;
        }
        catch (err) {
            console.error(err.message);
            return { id: null, success: false };
        }
    }
}
exports.default = DatabaseHelper;
;
//# sourceMappingURL=databaseHelper.js.map