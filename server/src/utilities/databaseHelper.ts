import fs from 'fs';
import path from 'path';

import bcrypt from 'bcryptjs';

import {createConnection, Connection, Repository} from 'typeorm';
import {User} from '../entity/User';

export default class DatabaseHelper {
    #connection: Connection;
    #userRepository: Repository<User>;

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

    private getUserRepository() {
        if (!this.#userRepository) {
            this.#userRepository = this.#connection.getRepository(User);
        }

        return this.#userRepository;
    }

    async getAllUsers() {
        let userRepository: Repository<User> = this.getUserRepository();
        let allUsers: User[] = await this.#userRepository.find();

        return allUsers;
    }

    async userExistsForEmail(email: string) {
        let userRepository: Repository<User> = this.getUserRepository();
        let foundUsers: User[] = await userRepository.find({email: email});
        
        return (foundUsers.length > 0)
    }

    async registerNewUser(email: string, password: string): Promise<Boolean> {
        try
        {
            let userRepository: Repository<User> = this.getUserRepository();
            let salt: string = await bcrypt.genSalt(10);
            let hash: string = await bcrypt.hash(password, salt);
            let newUser: User = new User();

            newUser = {...newUser, email: email, passwordHash: hash};

            await userRepository.save(newUser);

            return true;
        }
        catch (err)
        {
            console.error(err.message);
            return false;
        }
    }

    async validateCredentials(email: string, password: string): Promise<Boolean> {
        try
        {
            let userRepository: Repository<User> = this.getUserRepository();
            let foundUsers: User[] = await userRepository.find({email: email});

            if (foundUsers.length === 1) {
                let user: User = foundUsers[0];
                let passwordHash: string = user.passwordHash;

                return await bcrypt.compare(password, passwordHash);
            }

            return false;
        }
        catch (err)
        {
            console.error(err.message);
            return false;
        }
    }
};