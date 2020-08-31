import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import bcrypt from 'bcryptjs';

import {createConnection, Connection, Repository, QueryFailedError, ObjectLiteral} from 'typeorm';
import {User} from '../entity/User';
import {ProfilePicture} from '../entity/ProfilePicture';
import {UserJWT} from '../entity/UserJWT';
import * as Constants from '../constants/constants';
import { PasswordResetToken } from '../entity/PasswordResetToken';

export default class DatabaseHelper {
    private static instance: DatabaseHelper;

    #connection: Connection;
    #userRepository: Repository<User>;
    #userJWTRepository: Repository<UserJWT>;
    #pfpRepository: Repository<ProfilePicture>;
    #passwordResetTokenRepository: Repository<PasswordResetToken>

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
                if (error && error.query) {
                    console.error(`${error.message}\nQuery: ${error.query}`);
                }
                else {
                    console.error(error);
                }
            });
        });
    };

    private getUserRepository() {
        if (!this.#userRepository) {
            this.#userRepository = this.#connection.getRepository(User);
        }

        return this.#userRepository;
    }

    private getUserJWTRepository() {
        if (!this.#userJWTRepository) {
            this.#userJWTRepository = this.#connection.getRepository(UserJWT);
        }

        return this.#userJWTRepository;
    }

    private getProfilePictureRepository() {
        if (!this.#pfpRepository) {
            this.#pfpRepository = this.#connection.getRepository(ProfilePicture);
        }

        return this.#pfpRepository;
    }

    private getPasswordResetTokenRepository() {
        if (!this.#passwordResetTokenRepository) {
            this.#passwordResetTokenRepository = this.#connection.getRepository(PasswordResetToken);
        }

        return this.#passwordResetTokenRepository;
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
            let foundUsers: User[] = await userRepository.find({email});

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

    async generatePasswordResetToken(email: string): Promise<{token: string | null, errorCode: number}> {
        let errorCode: number = 0;
        let token: string | null = null;

        try
        {
            const userRepository: Repository<User> = this.getUserRepository();
            let foundUsers: User[] = await userRepository.find({email});

            if (foundUsers.length === 1) {
                let passwordResetTokenRepository: Repository<PasswordResetToken> = this.getPasswordResetTokenRepository();
                let user: User = foundUsers[0];
                let currentDate: Date = new Date(Date.now());

                let activeTokens: PasswordResetToken[] = await passwordResetTokenRepository.createQueryBuilder('rpt')
                    .innerJoinAndSelect('rpt.registeredUser', 'user')
                    .where('user.id = rpt.registeredUserId AND rpt.expirationDate > :currentDate', {currentDate})
                    .getMany();
                
                if (activeTokens.length < Constants.RPT_MAX_ACTIVE_TOKENS) {
                    token = uuidv4();
                    let newPassResetToken: PasswordResetToken = new PasswordResetToken();
                    let expirationDate: Date = new Date(Date.now()).addMinutes(Constants.RPT_EXPIRATION_MINUTES);

                    newPassResetToken.registeredUserId = user.id;
                    newPassResetToken.token = token;
                    newPassResetToken.expirationDate = expirationDate;

                    passwordResetTokenRepository.save(newPassResetToken);

                    errorCode = 0;
                }
                else {
                    errorCode = 3;
                }
            }
            else {
                errorCode = 2;
            }
        }
        catch (err)
        {
            console.error(err.message);
            errorCode = 1;
        }

        return {token, errorCode};
    }

    async addProfilePictureToUser(fileName: string, smallFileName: string, originalFileName: string, mimeType: string, userId: string): Promise<{success: Boolean}> {
        try
        {
            let registeredUser: User | undefined = await this.getUserWithId(userId);
            
            if (registeredUser) {
                let pfpRepository: Repository<ProfilePicture> = this.getProfilePictureRepository();
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
        let userRepository: Repository<User> = this.getUserRepository();
        let registeredUser: User | undefined = undefined;

        try
        {
            registeredUser = await userRepository.findOne({uniqueID: userId}, {relations: ['profilePictures']});
        }
        catch (err)
        {
            console.error(`Error looking up user with id ${userId}: ${err.message}`);
        }
        
        if (registeredUser && registeredUser.profilePictures.length > 0) {
            // To guarantee we get the latest one, we could sort the array first
            // registeredUser.profilePictures.sort((a, b) => { return b.id - a.id});

            // However, it should just query them in ascending order by default, so we can just take the last one and save on some performance
            let profilePicture: ProfilePicture = registeredUser.profilePictures[registeredUser.profilePictures.length - 1];
            
            return originalSize ? profilePicture.fileName : profilePicture.smallFileName;
        }

        return null;
    }

    async addJWTToUser(userId: string, jwtInfo: {jti: string, expirationDate: Date}): Promise<{success: Boolean}> {
        try
        {
            let userRepository: Repository<User> = this.getUserRepository();
            let registeredUser: User | undefined = undefined;

            try
            {
                registeredUser = await userRepository.findOne({uniqueID: userId}, {relations: ['activeJWTs']});
            }
            catch (err)
            {
                console.error(`Error looking up user with id ${userId}: ${err.message}`);
            }
            
            if (registeredUser) {
                let jwtRepository: Repository<UserJWT> = this.getUserJWTRepository();
                let newJWT: UserJWT = new UserJWT();

                newJWT = {...newJWT, ...jwtInfo, registeredUserId: registeredUser.id, isValid: true};

                try
                {
                    await jwtRepository.save(newJWT);
                }
                catch (err)
                {
                    console.error(`Error saving new JWT to database: ${err.message}`);
                    return {success: false};
                }

                return {success: true};
            }
        }
        catch (err)
        {
            console.error(`Error adding new JWT to user ${userId}: ${err.message}`);
        }

        return {success: false};
    }

    async extendJWTForUser(userId: string, jwtInfo: {jti: string, expirationDate: Date}): Promise<{success: Boolean}> {
        try
        {
            let userRepository: Repository<User> = this.getUserRepository();
            let registeredUser: User | undefined = undefined;

            try
            {
                registeredUser = await userRepository.createQueryBuilder('user')
                .innerJoinAndSelect('user.activeJWTs', 'jwt')
                .where('jwt.jti = :jti', {jti: jwtInfo.jti})
                .getOne();
            }
            catch (err)
            {
                console.error(`Error looking up user with id ${userId}: ${err.message}`);
            }
            
            if (registeredUser) {
                let activeJWT: UserJWT = registeredUser.activeJWTs[0];
                let jwtRepository: Repository<UserJWT> = this.getUserJWTRepository();

                activeJWT.expirationDate = jwtInfo.expirationDate;

                try
                {
                    await jwtRepository.save(activeJWT);
                }
                catch (err)
                {
                    console.error(`Error saving extended JWT to database: ${err.message}`);
                    return {success: false};
                }

                return {success: true};
            }
        }
        catch (err)
        {
            console.error(`Error extending JWT for user ${userId}: ${err.message}`);
        }

        return {success: false};
    }

    async validateJWTForUserId(userId: string, jti: string): Promise<Boolean> {
        let userRepository: Repository<User> = this.getUserRepository();
        let registeredUser: User | undefined = undefined;

        try
        {
            //registeredUser = await userRepository.findOne({uniqueID: userId}, {relations: ['activeJWTs']});
            registeredUser = await userRepository.createQueryBuilder('user')
            .innerJoinAndSelect('user.activeJWTs', 'jwt')
            .where('jwt.jti = :jti AND jwt.isValid = 1 AND jwt.expirationDate > now()', {jti})
            .getOne();
        }
        catch (err)
        {
            console.error(`Error looking up user with id ${userId}: ${err.message}`);
        }
        
        if (registeredUser) {
            return true;
        }

        return false;
    }

    async invalidateJWTsForUser(userId: string, mode: number = Constants.INVALIDATE_TOKEN_MODE.SPECIFIC, jti?: string): Promise<{success: Boolean}> {
        try
        {
            let userRepository: Repository<User> = this.getUserRepository();
            let registeredUser: User | undefined = undefined;
            let whereClause: string = 'jwt.isValid = 1 AND jwt.expirationDate > now()';
            let parameters: ObjectLiteral | undefined = jti ? {jti} : undefined;

            if (!jti) { // If we don't have an ID, then we have to expire all of them
                mode = Constants.INVALIDATE_TOKEN_MODE.ALL;
            }

            switch (mode) {
            case Constants.INVALIDATE_TOKEN_MODE.ALL:
                break;
            case Constants.INVALIDATE_TOKEN_MODE.OTHERS:
                whereClause += ' AND jwt.jti != :jti';
                break;
            case Constants.INVALIDATE_TOKEN_MODE.SPECIFIC:
            default:
                whereClause += ' AND jwt.jti = :jti';
                break;
            }
            
            try
            {
                registeredUser = await userRepository.createQueryBuilder('user')
                    .innerJoinAndSelect('user.activeJWTs', 'jwt')
                    .where(whereClause, parameters)
                    .getOne();
            }
            catch (err)
            {
                console.error(`Error looking up user with id ${userId}: ${err.message}`);
            }
            
            if (registeredUser) {
                if (registeredUser.activeJWTs.length > 0) {
                    // Invalidate all previous active JWTs if they exist
                    registeredUser.activeJWTs.forEach((activeJWT) => {
                        activeJWT.isValid = false;
                        activeJWT.formerRegisteredUserId = registeredUser!.id;
                        activeJWT.registeredUserId = null;
                    });

                    let jwtRepository: Repository<UserJWT> = this.#connection.getRepository(UserJWT);

                    await jwtRepository.save(registeredUser.activeJWTs);
                }

                return {success: true};
            }
        }
        catch (err)
        {
            console.error(`Error Invalidating JWTs: ${err.message}`);
        }

        return {success: false};
    }
};