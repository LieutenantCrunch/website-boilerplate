import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import bcrypt from 'bcryptjs';

import {createConnection, Connection, Repository} from 'typeorm';
import {User} from '../entity/User';
import {ProfilePicture} from '../entity/ProfilePicture';

export default class DatabaseHelper {
    private static instance: DatabaseHelper;

    #connection: Connection;
    #userRepository: Repository<User>;

    constructor() {
        if (DatabaseHelper.instance) {
            return DatabaseHelper.instance;
        }

        DatabaseHelper.instance = this;

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

    async getAllUsers(): Promise<User[]> {
        let userRepository: Repository<User> = this.getUserRepository();

        try
        {
            let allUsers: User[] = await userRepository.find();
            
            return allUsers;
        }
        catch (err)
        {
            console.error(`Failed to retrieve users: ${err.message}`);
        }

        return [];
    }

    async userExistsForEmail(email: string): Promise<Boolean> {
        let userRepository: Repository<User> = this.getUserRepository();
        
        try
        {
            let foundUsers: User[] = await userRepository.find({email: email});

            return (foundUsers.length > 0);
        }
        catch (err)
        {
            console.error(`Could not find any users for email ${email}: ${err.message}`);
        }
        
        return false;
    }

    async getUserWithId(id: string): Promise<User | undefined> {
        let userRepository: Repository<User> = this.getUserRepository();

        try
        {
            return await userRepository.findOne({uniqueID: id});
        }
        catch (err)
        {
            console.error(`Error looking up user with id ${id}: ${err.message}`);
        }

        return undefined;
    }

    async registerNewUser(email: string, password: string): Promise<{id: string | null, success: Boolean}> {
        try
        {
            let userRepository: Repository<User> = this.getUserRepository();
            let salt: string = await bcrypt.genSalt(10);
            let hash: string = await bcrypt.hash(password, salt);
            let userUUID: string = uuidv4();
            let newUser: User = new User();

            newUser = {...newUser, email: email, passwordHash: hash, uniqueID: userUUID};

            try
            {
                await userRepository.save(newUser);
            }
            catch(err)
            {
                console.error(`Error saving User to database: ${err.message}`);
                return {id: null, success: false};
            }

            return {id: userUUID, success: true};
        }
        catch (err)
        {
            console.error(err.message);
            return {id: null, success: false};
        }
    }

    async validateCredentials(email: string, password: string): Promise<{id: string | null, success: Boolean}> {
        try
        {
            let userRepository: Repository<User> = this.getUserRepository();
            let foundUsers: User[] = await userRepository.find({email: email});

            if (foundUsers.length === 1) {
                let user: User = foundUsers[0];
                let passwordHash: string = user.passwordHash;
                let isValid = await bcrypt.compare(password, passwordHash);

                return {id: user.uniqueID, success: isValid};
            }

            return {id: null, success: false};;
        }
        catch (err)
        {
            console.error(err.message);
            return {id: null, success: false};
        }
    }

    async addProfilePictureToUser(fileName: string, smallFileName: string, originalFileName: string, mimeType: string, userId: string): Promise<{success: Boolean}> {
        try
        {
            let registeredUser: User | undefined = await this.getUserWithId(userId);
            
            if (registeredUser) {
                let pfpRepository: Repository<ProfilePicture> = this.#connection.getRepository(ProfilePicture);
                let newPFP: ProfilePicture = new ProfilePicture();

                newPFP = {...newPFP, fileName, smallFileName, originalFileName, mimeType, registeredUserId: registeredUser.id};

                try
                {
                    await pfpRepository.save(newPFP);
                }
                catch (err)
                {
                    console.error(`Error saving Profile Picture to database: ${err.message}`);
                    return {success: false};
                }

                return {success: true};
            }
        }
        catch (err)
        {
            console.error(`Error looking up user for Profile Picture: ${err.message}`);
        }

        return {success: false};
    }

    async getPFPFileNameForUserId(userId: string, originalSize?: Boolean): Promise<string | null> {
        let registeredUser: User | undefined = await this.getUserWithId(userId);
        
        if (registeredUser) {
            let pfpRepository: Repository<ProfilePicture> = this.#connection.getRepository(ProfilePicture);
            try
            {
                let profilePicture: ProfilePicture | undefined = await pfpRepository.findOne({
                    where: {
                        registeredUserId: registeredUser.id
                    },
                    order: {
                        id: 'DESC'
                    }
                });

                if (profilePicture) {
                    return originalSize ? profilePicture.fileName : profilePicture.smallFileName;
                }
            }
            catch (err)
            {
                console.error(`Failed to retrieve PFP for UserID: ${userId}: ${err.message}`);
            }
        }

        return null;
    }
};