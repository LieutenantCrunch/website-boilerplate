import fs from 'fs';
import path from 'path';

import {createConnection, Connection, Repository} from 'typeorm';
import {User} from '../entity/User';

export default class DatabaseHelper {
    #connection: Connection;

    constructor() {
        fs.readFile('./private/dbpass.txt', 'utf8', (readFileError: NodeJS.ErrnoException | null, data: string) => {
            if (readFileError) {
                console.error(readFileError);
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
                    path.resolve(__dirname, '../entity/*.js')
                ]
            }).then((con: Connection) => {
                this.#connection = con;
                console.log('Successfully connected to database')
            }).catch((error: any) => {
                console.error(error);
            });
        });
    };

    async getAllUsers() {
        let userRepository: Repository<User> = this.#connection.getRepository(User);
        let allUsers: User[] = await userRepository.find();

        return allUsers;
    }

    async userExistsForEmail(email: string) {
        let userRepository: Repository<User> = this.#connection.getRepository(User);
        let foundUsers: User[] = await userRepository.find({email: email});
        
        return (foundUsers.length > 0)
    }
};