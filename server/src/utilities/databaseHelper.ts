import fs, { truncateSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import bcrypt from 'bcryptjs';

import {Brackets, createConnection, Connection, DeleteQueryBuilder, DeleteResult, Repository, ObjectLiteral, SelectQueryBuilder} from 'typeorm';

import {User} from '../entity/User';
import {ProfilePicture} from '../entity/ProfilePicture';
import {UserJWT} from '../entity/UserJWT';
import {DisplayName} from '../entity/DisplayName';
import {Role} from '../entity/Role';
import {UserConnection} from '../entity/UserConnection';
import * as Constants from '../constants/constants';
import { PasswordResetToken } from '../entity/PasswordResetToken';
import { UserConnectionType } from '../entity/UserConnectionType';

import { Op } from 'sequelize';
import { db } from '../models/_index';
import { DbInterface } from '../typings/DbInterface';
import { Sequelize } from 'sequelize';
import { UserInstance } from '../models/User';
import { ProfilePictureInstance } from '../models/ProfilePicture';
import { UserJWTInstance } from '../models/UserJWT';
import { UserConnectionViewInstance } from '../models/views/UserConnectionView';
import { DisplayNameInstance } from '../models/DisplayName';
import { UserConnectionInstance } from '../models/UserConnection';
import { UserConnectionTypeInstance } from '../models/UserConnectionType';
import { PasswordResetTokenInstance } from '../models/PasswordResetToken';

class DatabaseHelper {
    private static instance: DatabaseHelper;

    #connection: Connection;
    #userRepository: Repository<User>;
    #userJWTRepository: Repository<UserJWT>;
    #pfpRepository: Repository<ProfilePicture>;
    #passwordResetTokenRepository: Repository<PasswordResetToken>;
    #displayNameRepository: Repository<DisplayName>;
    #userConnectionRepository: Repository<UserConnection>;
    #userConnectionTypeRepository: Repository<UserConnectionType>;

    constructor() {
        if (DatabaseHelper.instance) {
            return DatabaseHelper.instance;
        }

        DatabaseHelper.instance = this;

        fs.readFile('./private/dbpass.txt', 'utf8', (readFileError: NodeJS.ErrnoException | null, data: string) => {
            if (readFileError) {
                console.error(readFileError);
            }

            db.sequelize.authenticate()
            .then(() => {
                console.log(`Successfully connected to database via Sequelize.`);
            })
            .catch((err: Error) =>
            {
                console.error(`Unable to connect to the database: ${err.message}`);
            });
    
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

    private getUserRepository(): Repository<User> {
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

    private getDisplayNameRepository() {
        if (!this.#displayNameRepository) {
            this.#displayNameRepository = this.#connection.getRepository(DisplayName);
        }

        return this.#displayNameRepository;
    }

    private getUserConnectionRepository() {
        if (!this.#userConnectionRepository) {
            this.#userConnectionRepository = this.#connection.getRepository(UserConnection);
        }

        return this.#userConnectionRepository;
    }

    private getUserConnectionTypeRepository() {
        if (!this.#userConnectionTypeRepository) {
            this.#userConnectionTypeRepository = this.#connection.getRepository(UserConnectionType);
        }

        return this.#userConnectionTypeRepository;
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
        try
        {
            let s_registeredUser: UserInstance | null = await db.User.findOne({
                where: {
                    email
                }
            });

            if (s_registeredUser) {
                return true;
            }
        }
        catch (err)
        {
            console.error(`Could not find any users for email ${email}: ${err.message}`);
        }

        /* TypeORM
        let userRepository: Repository<User> = this.getUserRepository();
        
        try
        {
            let foundUsers: User[] = await userRepository.find({email: email});

            return (foundUsers.length > 0);
        }
        catch (err)
        {
            console.error(`Could not find any users for email ${email}: ${err.message}`);
        }*/
        
        return false;
    }

    async getUserIdForUniqueId(uniqueId: string): Promise<number | undefined> {
        try
        {
            let s_registeredUser: UserInstance | null = await db.User.findOne({
                where: {
                    uniqueId
                }
            });

            if (s_registeredUser) {
                return s_registeredUser.id;
            }
        }
        catch (err)
        {
            console.error(`Error looking up user with unique id ${uniqueId}: ${err.message}`);
        }

        /* TypeORM
        let userRepository: Repository<User> = this.getUserRepository();

        try
        {
            let {id}: {id: number} = await userRepository.createQueryBuilder('u')
                .select('u.id', 'id')
                .where('u.uniqueId = :uniqueId', {uniqueId})
                .getRawOne();

            return id;
        }
        catch (err)
        {
            console.error(`Error looking up user with unique id ${uniqueId}: ${err.message}`);
        }*/

        return undefined;
    }

    async gets_UserWithUniqueId(uniqueId: string): Promise<UserInstance | null> {
        try
        {
            let s_registeredUser: UserInstance | null = await db.User.findOne({
                where: {
                    uniqueId
                }
            });

            return s_registeredUser;
        }
        catch (err)
        {
            console.error(`Error looking up user with uniqueId ${uniqueId}: ${err.message}`);
        }
        
        return null;
    }

    async getUserWithId(id: string): Promise<User | undefined> {
        let userRepository: Repository<User> = this.getUserRepository();

        try
        {
            return await userRepository.findOne({uniqueId: id});
        }
        catch (err)
        {
            console.error(`Error looking up user with id ${id}: ${err.message}`);
        }

        return undefined;
    }

    async registerNewUser(email: string, displayName: string, password: string): Promise<{id: string | null, success: Boolean}> {
        try
        {
            if (!displayName || displayName.indexOf('#') > -1) {
                return {id: null, success: false};
            }

            let salt: string = await bcrypt.genSalt(10);
            let passwordHash: string = await bcrypt.hash(password, salt);
            let uniqueId: string = uuidv4();

            let s_registeredUser: UserInstance | null = await db.User.create({
                email,
                passwordHash,
                uniqueId
            });

            if (s_registeredUser) {
                let results: {success: Boolean, displayNameIndex?: number, message?: string} = await this.setUserDisplayName(uniqueId, displayName);

                return {id: uniqueId, success: true};
            }
        }
        catch (err)
        {
            console.error(`Error saving User to database: ${err.message}`);
        }

        return {id: null, success: false};
        /* TypeORM
        try
        {
            if (!displayName || displayName.indexOf('#') > -1) {
                return {id: null, success: false};
            }

            let userRepository: Repository<User> = this.getUserRepository();
            let salt: string = await bcrypt.genSalt(10);
            let passwordHash: string = await bcrypt.hash(password, salt);
            let uniqueId: string = uuidv4();
            let newUser: User = new User();

            newUser = {...newUser, email, passwordHash, uniqueId};

            try
            {
                let registeredUser: User = await userRepository.save(newUser);
                let results: {success: Boolean, displayNameIndex?: number, message?: string} = await this.setUserDisplayName(uniqueId, displayName);
            }
            catch(err)
            {
                console.error(`Error saving User to database: ${err.message}`);
                return {id: null, success: false};
            }

            return {id: uniqueId, success: true};
        }
        catch (err)
        {
            console.error(err.message);
            return {id: null, success: false};
        }*/
    }

    async updateCredentials(email: string, password: string): Promise<Boolean> {
        try
        {
            let salt: string = await bcrypt.genSalt(10);
            let hash: string = await bcrypt.hash(password, salt);
            let s_registeredUser: UserInstance | null = await db.User.findOne({
                where: {
                    email
                }
            });

            if (s_registeredUser) {
                s_registeredUser.passwordHash = hash;
                await s_registeredUser.save();

                return true;
            }
        }
        catch (err)
        {
            console.error(err.message);
        }

        /* TypeORM
        try
        {
            let userRepository: Repository<User> = this.getUserRepository();
            let salt: string = await bcrypt.genSalt(10);
            let hash: string = await bcrypt.hash(password, salt);
            let user: User | undefined = await userRepository.findOne({email});

            if (user) {
                user.passwordHash = hash;
                await userRepository.save(user);

                return true;
            }
        }
        catch (err)
        {
            console.error(err.message);
        }*/

        return false;
    }

    async validateCredentials(email: string, password: string): Promise<{id: string | null, success: Boolean}> {
        try
        {
            let s_registeredUser: UserInstance | null = await db.User.findOne({
                where: {
                    email
                }
            });

            if (s_registeredUser) {
                let s_passwordHash: string = s_registeredUser.passwordHash;
                let isValid = await bcrypt.compare(password, s_passwordHash);

                return {id: s_registeredUser.uniqueId, success: isValid};
            }

            return {id: null, success: false};;
        }
        catch (err)
        {
            console.error(err.message);
            return {id: null, success: false};
        }

        /* TypeORM
        try
        {
            let userRepository: Repository<User> = this.getUserRepository();
            let foundUsers: User[] = await userRepository.find({email});

            if (foundUsers.length === 1) {
                let user: User = foundUsers[0];
                let passwordHash: string = user.passwordHash;
                let isValid = await bcrypt.compare(password, passwordHash);

                return {id: user.uniqueId, success: isValid};
            }

            return {id: null, success: false};;
        }
        catch (err)
        {
            console.error(err.message);
            return {id: null, success: false};
        }*/
    }

    async generatePasswordResetToken(email: string): Promise<{token: string | null, errorCode: number}> {
        let errorCode: number = 0;
        let token: string | null = null;

        try
        {
            let s_registeredUser: UserInstance | null = await db.User.findOne({
                where: {
                    email
                },
                include: {
                    model: db.PasswordResetToken,
                    as: 'passwordResetTokens',
                    required: false,
                    where: {
                        expirationDate: {
                            [Op.gt]: (new Date())
                        }
                    }
                }
            });

            if (s_registeredUser) {
                if (s_registeredUser.passwordResetTokens && s_registeredUser.passwordResetTokens.length < Constants.RPT_MAX_ACTIVE_TOKENS) {
                    token = uuidv4();

                    let expirationDate: Date = new Date(Date.now()).addMinutes(Constants.RPT_EXPIRATION_MINUTES);

                    let s_newResetToken: PasswordResetTokenInstance = await s_registeredUser.createPasswordResetToken({
                        token,
                        expirationDate
                    });

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

        /* TypeORM
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
                    .innerJoin('rpt.registeredUser', 'user')
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
        }*/

        return {token, errorCode};
    }

    async validatePasswordResetToken(token: string, email: string): Promise<Boolean> {
        try
        {
            let s_resetToken: PasswordResetTokenInstance | null = await db.PasswordResetToken.findOne({
                where: {
                    token
                },
                include: {
                    model: db.User,
                    as: 'registeredUser',
                    required: true,
                    where: {
                        email
                    }
                }
            });

            if (s_resetToken) {
                return true;
            }
        }
        catch (err)
        {
            console.error(err.message);
        }

        /* TypeORM
        try
        {
            let passwordResetTokenRepository: Repository<PasswordResetToken> = this.getPasswordResetTokenRepository();
            let foundToken: PasswordResetToken | undefined = await passwordResetTokenRepository.createQueryBuilder('rpt')
                .innerJoin('rpt.registeredUser', 'user')
                .where('rpt.token = :token AND user.email = :email', {token, email})
                .getOne();

            if (foundToken) {
                return true;
            }
        }
        catch (err)
        {
            console.error(err.message);
        }*/

        return false;
    }

    async addProfilePictureToUser(fileName: string, smallFileName: string, originalFileName: string, mimeType: string, userId: string): Promise<{success: Boolean}> {
        try
        {
            let s_registeredUser: UserInstance | null = await this.gets_UserWithUniqueId(userId);
            
            if (s_registeredUser) {
                let s_newPFP: ProfilePictureInstance | null = await s_registeredUser.createProfilePicture({
                    fileName,
                    smallFileName,
                    originalFileName
                });

                if (s_newPFP) {
                    return {success: true};
                }
            }
        }
        catch (err)
        {
            console.error(`Error looking up user for Profile Picture: ${err.message}`);
        }

        /* TypeORM
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
        }*/

        return {success: false};
    }

    async getPFPFileNameForUserId(uniqueId: string, originalSize?: Boolean): Promise<string | null> {
        try
        {
            let s_registeredUser: UserInstance | null = await db.User.findOne({
                where: {
                    uniqueId
                }
            });

            if (s_registeredUser) {
                let s_registeredUserPfps: ProfilePictureInstance[] = await s_registeredUser.getProfilePictures({
                    order: [['id', 'DESC']]
                });

                if (s_registeredUserPfps.length > 0) {
                    let s_registeredUserPfp: ProfilePictureInstance = s_registeredUserPfps[0];

                    return originalSize ? s_registeredUserPfp.fileName : s_registeredUserPfp.smallFileName;
                }
            }
        }
        catch (err)
        {
            console.error(`Error looking up user with id ${uniqueId}: ${err.message}`);
        }

        /* TypeORM
        let userRepository: Repository<User> = this.getUserRepository();
        let registeredUser: User | undefined = undefined;

        try
        {
            registeredUser = await userRepository.createQueryBuilder('u')
                .where('u.uniqueId = :uniqueId', {uniqueId})
                .innerJoinAndSelect('u.profilePictures', 'pfp')
                .orderBy('pfp.id', 'DESC')
                .getOne();
        }
        catch (err)
        {
            console.error(`Error looking up user with id ${uniqueId}: ${err.message}`);
        }
        
        if (registeredUser && registeredUser.profilePictures.length > 0) {
            let profilePicture: ProfilePicture = registeredUser.profilePictures[0];
            
            return originalSize ? profilePicture.fileName : profilePicture.smallFileName;
        }*/

        return null;
    }

    async addJWTToUser(uniqueId: string, jwtInfo: {jti: string, expirationDate: Date}): Promise<{success: Boolean}> {
        try
        {
            let s_registeredUser: UserInstance | null = await this.gets_UserWithUniqueId(uniqueId);
            
            if (s_registeredUser) {
                let s_newJWT: UserJWTInstance | null = await s_registeredUser.createActiveJWT({
                    ...jwtInfo,
                    isValid: true
                });

                if (s_newJWT) {
                    return {success: true};
                }
            }
        }
        catch (err)
        {
            console.error(`Error adding new JWT to user ${uniqueId}: ${err.message}`);
        }

        /* TypeORM
        try
        {
            let userRepository: Repository<User> = this.getUserRepository();
            let registeredUser: User | undefined = undefined;

            try
            {
                registeredUser = await userRepository.findOne({uniqueId}, {relations: ['activeJWTs']});
            }
            catch (err)
            {
                console.error(`Error looking up user with id ${uniqueId}: ${err.message}`);
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
            console.error(`Error adding new JWT to user ${uniqueId}: ${err.message}`);
        }*/

        return {success: false};
    }

    async extendJWTForUser(uniqueId: string, jwtInfo: {jti: string, expirationDate: Date}): Promise<{success: Boolean}> {
        try
        {
            let s_registeredUser: UserInstance | null = await db.User.findOne({
                where: {
                    uniqueId
                },
                include: {
                    model: db.UserJWT,
                    as: 'activeJWTs',
                    required: true,
                    where: {
                        jti: jwtInfo.jti
                    }
                }
            });
            
            if (s_registeredUser && s_registeredUser.activeJWTs) {
                let s_activeJWT: UserJWTInstance = s_registeredUser.activeJWTs[0];
                
                s_activeJWT.expirationDate = jwtInfo.expirationDate;
                s_activeJWT.save();

                return {success: true};
            }
        }
        catch (err)
        {
            console.error(`Error extending JWT for user ${uniqueId}: ${err.message}`);
        }

        /* TypeORM
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
                console.error(`Error looking up user with id ${uniqueId}: ${err.message}`);
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
            console.error(`Error extending JWT for user ${uniqueId}: ${err.message}`);
        }*/

        return {success: false};
    }

    async validateJWTForUserId(uniqueId: string, jti: string): Promise<Boolean> {
        try
        {
            let s_registeredUser: UserInstance | null = await db.User.findOne({
                where: {
                    uniqueId
                }
            });

            if (s_registeredUser) {
                let s_activeJWTs: UserJWTInstance[] = await s_registeredUser.getActiveJWTs({
                    where: {
                        jti,
                        isValid: 1,
                        expirationDate: {
                            [Op.gt]: (new Date())
                        }
                    }
                });

                if (s_activeJWTs.length > 0) {
                    return true;
                }
            }
        }
        catch (err)
        {
            console.error(`Error looking up JTI for user with id ${uniqueId}: ${err.message}`);
        }


        /* TypeORM
        let userRepository: Repository<User> = this.getUserRepository();
        let registeredUser: User | undefined = undefined;

        try
        {
            registeredUser = await userRepository.createQueryBuilder('user')
            .innerJoin('user.activeJWTs', 'jwt')
            .where('jwt.jti = :jti AND jwt.isValid = 1 AND jwt.expirationDate > now()', {jti})
            .getOne();
        }
        catch (err)
        {
            console.error(`Error looking up user with id ${uniqueId}: ${err.message}`);
        }
        
        if (registeredUser) {
            return true;
        }*/

        return false;
    }

    async invalidateJWTsForUser(uniqueId: string, mode: number = Constants.INVALIDATE_TOKEN_MODE.SPECIFIC, jti?: string): Promise<{success: Boolean}> {
        try
        {
            if (!jti) { // If we don't have an ID, then we have to expire all of them
                mode = Constants.INVALIDATE_TOKEN_MODE.ALL;
            }

            let additionalQueryOptions: ObjectLiteral = {};
            
            switch (mode) {
                case Constants.INVALIDATE_TOKEN_MODE.ALL:
                    break;
                case Constants.INVALIDATE_TOKEN_MODE.OTHERS:
                    additionalQueryOptions = {
                        jti: {
                            [Op.ne]: jti
                        }
                    };
                    break;
                case Constants.INVALIDATE_TOKEN_MODE.SPECIFIC:
                default:
                    additionalQueryOptions = {
                        jti
                    };    
                    break;
            }

            let s_registeredUser: UserInstance | null = await db.User.findOne({
                where: {
                    uniqueId
                },
                include: {
                    model: db.UserJWT,
                    as: 'activeJWTs',
                    required: true,
                    where: {
                        isValid: 1,
                        expirationDate: {
                            [Op.gt]: (new Date())
                        },
                        ...additionalQueryOptions
                    }
                }
            });

            if (s_registeredUser && s_registeredUser.activeJWTs) {
                let s_JWTs: UserJWTInstance[] = s_registeredUser.activeJWTs;
                let idArray: number[] = s_JWTs.map(s_JWT => s_JWT.id!);

                await db.UserJWT.update(
                    {
                        isValid: false
                    },
                    {
                        where: {
                            id: idArray
                        }
                    }
                );

                await s_registeredUser!.removeActiveJWTs(s_JWTs);
                await s_registeredUser!.addInactiveJWTs(s_JWTs);

                return {success: true};
            }
        }
        catch (err)
        {
            console.error(`Error Invalidating JWTs: ${err.message}`);
        }

        /* TypeORM
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
                console.error(`Error looking up user with id ${uniqueId}: ${err.message}`);
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
        }*/

        return {success: false};
    }

    async getUserEmail(uniqueId: string): Promise<string | null> {
        try
        {   
            let s_registeredUser: UserInstance | null = await db.User.findOne({
                where: {
                    uniqueId
                }
            });

            if (s_registeredUser) {
                return s_registeredUser.email;
            }
        }
        catch (err)
        {
            console.error(`Error getting email for user ${uniqueId}:\n${err.message}`);
        }

        /* TypeORM
        try {
            let userRepository: Repository<User> = this.getUserRepository();
            let user: User | undefined = await userRepository.findOne({uniqueId});

            if (user) {
                return user.email;
            }
        }
        catch (err) {
            console.error(`Error getting email for user ${uniqueId}:\n${err.message}`);
        }*/

        return null;
    }

    async setUserEmail(uniqueId: string, email: string): Promise<{success: Boolean, message?: string}> {
        try {
            let s_registeredUser: UserInstance | null = await this.gets_UserWithUniqueId(uniqueId);

            if (s_registeredUser) {
                s_registeredUser.email = email;
                await s_registeredUser.save();

                return {success: true};
            }
        }
        catch (err) {
            console.error(`Error changing email for user ${uniqueId}:\n${err.message}`);
        }

        return {success: false, message: `There was an error updating your email address, please try again.`};

        /* TypeORM
        try {
            let userRepository: Repository<User> = this.getUserRepository();
            let user: User | undefined = await userRepository.findOne({uniqueId});

            if (user) {
                user.email = email;
                await userRepository.save(user);

                return {success: true};
            }

            return {success: false, message: `User not found.`};
        }
        catch (err) {
            return {success: false, message: `Error changing email for user ${uniqueId}:\n${err.message}`};
        }*/
    }

    async getUserDisplayName(uniqueId: string): Promise<string | null> {
        try {
            let s_registeredUser: UserInstance | null = await this.gets_UserWithUniqueId(uniqueId);

            if (s_registeredUser) {
                let s_displayNames: DisplayNameInstance[] = await s_registeredUser.getDisplayNames({
                    where: {
                        isActive: true
                    }
                });

                if (s_displayNames.length > 0) {
                    return s_displayNames[0].displayName;
                }
            }
        }
        catch (err) {
            console.error(`Error getting display name for user ${uniqueId}:\n${err.message}`);
        }

        /* TypeORM
        try {
            let userRepository: Repository<User> = this.getUserRepository();
            let user: User | undefined = await userRepository.createQueryBuilder('u')
                .innerJoinAndSelect('u.displayNames', 'dn')
                .where('u.uniqueId = :uniqueId AND dn.isActive = 1', {uniqueId})
                .getOne();

            if (user) {
                return user.displayNames[0].displayName;
            }
        }
        catch (err) {
            console.error(`Error getting display name for user ${uniqueId}:\n${err.message}`);
        }*/

        return null;
    }

    async setUserDisplayName(uniqueId: string, displayName: string): Promise<{success: Boolean, displayNameIndex?: number, message?: string}> {
        try
        {
            let s_registeredUser: UserInstance | null = await this.gets_UserWithUniqueId(uniqueId);

            if (!s_registeredUser) {
                return {success: false, message: `No user found for when trying to change the display name`};
            }

            let s_displayNames: DisplayNameInstance[] = await s_registeredUser.getDisplayNames({
                order: [['activationDate', 'DESC']]
            });

            let currentDate: Date = new Date(Date.now());

            // If they have existing display names
            if (s_displayNames.length > 0) {
                let s_currentDisplayName: DisplayNameInstance | undefined = s_displayNames.find(entry => entry.isActive);
                let s_matchingDisplayName: DisplayNameInstance | undefined = s_displayNames.find(entry => entry.displayName === displayName);
                let mostRecentChange: Date = s_displayNames[0].activationDate;

                // Check if they haven't changed their name in at least the configured amount of days

                if ((currentDate.getTime() - mostRecentChange.getTime())/(1000 * 60 * 60 * 24) <= Constants.DISPLAY_NAME_CHANGE_DAYS) {
                    let nextAvailableChange: Date = new Date(mostRecentChange.getTime() + (1000 * 60 * 60 * 24 * Constants.DISPLAY_NAME_CHANGE_DAYS));
                    // Fail with message
                    return {success: false, message: `It hasn't been ${Constants.DISPLAY_NAME_CHANGE_DAYS} day${Constants.DISPLAY_NAME_CHANGE_DAYS === 1 ? '' : 's'} since the last time you changed your display name. You can change your display name again on ${nextAvailableChange.toLocaleString()}.`};
                }

                if (s_currentDisplayName) {
                    if (s_currentDisplayName === s_matchingDisplayName) {
                        // No need to make any changes, they already have the specified display name, return without doing anything else
                        return {success: true, displayNameIndex: s_matchingDisplayName.displayNameIndex, message: 'Your display name has been changed successfully.'};
                    }
                    else {
                        // Deactivate the current display name
                        s_currentDisplayName.isActive = false;
                        s_currentDisplayName.save();
                    }
                }

                if (s_matchingDisplayName) {
                    // Reactivate the former display name and return without creating a new display name
                    s_matchingDisplayName.isActive = true;
                    s_matchingDisplayName.activationDate = currentDate;
                    s_matchingDisplayName.save();

                    return {success: true, displayNameIndex: s_matchingDisplayName.displayNameIndex, message: 'Your display name has been changed successfully.'};
                }
            }

            // Create a new display name
            const currentMax: number = await db.DisplayName.max('displayNameIndex', {
                where: {
                    displayName
                }
            });

            const nextIndex: number = (isNaN(currentMax) ? 0 : currentMax) + 1;

            let newDisplayName: DisplayNameInstance = await db.DisplayName.create({
                registeredUserId: s_registeredUser.id!,
                displayName,
                displayNameIndex: nextIndex,
                activationDate: currentDate,
                isActive: true
            });

            // Success
            return {success: true, displayNameIndex: nextIndex, message: 'Your display name has been changed successfully.'};
        }
        catch (err) {
            console.error(err.message);

            return {success: false, message: `There was an issue changing the display name.`};
        }
        /* TypeORM
        try
        {
            let userRepository: Repository<User> = this.getUserRepository();
            let registeredUser: User | undefined = await userRepository.findOne({uniqueId});

            if (!registeredUser) {
                return {success: false, message: `No user found for when trying to change the display name`};
            }

            let displayNameRepository: Repository<DisplayName> = this.getDisplayNameRepository();

            // First check to see if they have used this display name previously
            let displayNames: DisplayName[] = await displayNameRepository.createQueryBuilder('dn')
                .where('dn.registeredUserId = :userId', {userId: registeredUser.id})
                .orderBy('dn.activationDate', 'DESC')
                .getMany();

            let currentDate: Date = new Date(Date.now());

            // If they have existing display names
            if (displayNames.length > 0) {
                let currentDisplayName: DisplayName | undefined = displayNames.find(entry => entry.isActive);
                let matchingDisplayName: DisplayName | undefined = displayNames.find(entry => entry.displayName === displayName);
                let mostRecentChange: Date = displayNames[0].activationDate;

                // Check if they haven't changed their name in at least the configured amount of days

                if ((currentDate.getTime() - mostRecentChange.getTime())/(1000 * 60 * 60 * 24) <= Constants.DISPLAY_NAME_CHANGE_DAYS) {
                    let nextAvailableChange: Date = new Date(mostRecentChange.getTime() + (1000 * 60 * 60 * 24 * Constants.DISPLAY_NAME_CHANGE_DAYS));
                    // Fail with message
                    return {success: false, message: `It hasn't been ${Constants.DISPLAY_NAME_CHANGE_DAYS} day${Constants.DISPLAY_NAME_CHANGE_DAYS === 1 ? '' : 's'} since the last time you changed your display name. You can change your display name again on ${nextAvailableChange.toLocaleString()}.`};
                }

                if (currentDisplayName) {
                    if (currentDisplayName === matchingDisplayName) {
                        // No need to make any changes, they already have the specified display name, return without doing anything else
                        return {success: true, displayNameIndex: matchingDisplayName.displayNameIndex, message: 'Your display name has been changed successfully.'};
                    }
                    else {
                        // Deactivate the current display name
                        currentDisplayName.isActive = false;
                        displayNameRepository.save(currentDisplayName);
                    }
                }

                if (matchingDisplayName) {
                    // Reactivate the former display name and return without creating a new display name
                    matchingDisplayName.isActive = true;
                    matchingDisplayName.activationDate = currentDate;
                    displayNameRepository.save(matchingDisplayName);

                    return {success: true, displayNameIndex: matchingDisplayName.displayNameIndex, message: 'Your display name has been changed successfully.'};
                }
            }

            // Create a new display name
            const { nextIndex } = await displayNameRepository.createQueryBuilder('dn')
                .select('IFNULL(MAX(dn.displayNameIndex), 0) + 1', 'nextIndex')
                .where('dn.displayName = :displayName', {displayName})
                .getRawOne();

            let newDisplayName: DisplayName = new DisplayName();

            newDisplayName.registeredUserId = registeredUser.id;
            newDisplayName.displayName = displayName;
            newDisplayName.displayNameIndex = nextIndex;
            newDisplayName.activationDate = currentDate;
            newDisplayName.isActive = true;

            await displayNameRepository.save(newDisplayName);

            // Success
            return {success: true, displayNameIndex: nextIndex, message: 'Your display name has been changed successfully.'};
        }
        catch (err) {
            console.error(err.message);

            return {success: false, message: `There was an issue changing the display name.`};
        }*/
    }

    async verifyUserDisplayName(uniqueId: string, displayName: string): Promise<{success: Boolean, message: string}> {
        try 
        {
            // Make sure the display name is not already verified
            let s_displayName: DisplayNameInstance | null = await db.DisplayName.findOne({
                where: {
                    displayName,
                    displayNameIndex: 0
                }
            });
           
            if (s_displayName) {
                return {success: false, message: 'That display name has already been verified.'};
            }
            else {
                s_displayName = await db.DisplayName.findOne({
                    where: {
                        displayName
                    },
                    include: {
                        model: db.User,
                        as: 'registeredUser',
                        where: {
                            uniqueId
                        },
                        required: true
                    }
                });
                
                if (s_displayName) {
                    s_displayName.displayNameIndex = 0;

                    s_displayName.save();

                    return {success: true, message: ''};
                }
            }
        }
        catch (err)
        {
            console.error(`Error validating display name (${displayName}) for user with unique id ${uniqueId}: err.message`);
        }

        /* TypeORM
        try {
            let displayNameRepository: Repository<DisplayName> = this.getDisplayNameRepository();

            // Make sure the display name is not already verified
            let displayNameRecord: DisplayName | undefined = await displayNameRepository.createQueryBuilder('dn')
                .where('dn.displayName = :displayName AND dn.displayNameIndex = 0', {displayName})
                .getOne();
            
            if (displayNameRecord) {
                return {success: false, message: 'That display name has already been verified.'};
            }
            else {
                displayNameRecord = await displayNameRepository.createQueryBuilder('dn')
                    .innerJoin('dn.registeredUser', 'u', `u.uniqueId = :uniqueId`, {uniqueId})
                    .where('dn.displayName = :displayName', {displayName})
                    .getOne();
                
                if (displayNameRecord) {
                    displayNameRecord.displayNameIndex = 0;

                    await displayNameRepository.save(displayNameRecord);

                    return {success: true, message: ''};
                }
            }
        }
        catch (err) {
            console.error(err.message);
        }*/

        return {success: false, message: `Error validating Display Name ${displayName} for user with unique ID ${uniqueId}, check log.`};
    }

    async getUserDetails(currentUniqueId: string | undefined, uniqueId: string, includeEmail: Boolean): Promise<WebsiteBoilerplate.UserDetails | null> {
        try {
            let getConnectionTypes = currentUniqueId && currentUniqueId !== uniqueId;

            let s_registeredUser: UserInstance | null = await db.User.findOne({
                where: {
                    uniqueId
                },
                include: [
                    {
                        model: db.DisplayName,
                        as: 'displayNames'
                    }, 
                    {
                        model: db.ProfilePicture,
                        as: 'profilePictures'
                    },
                    {
                        model: db.Role,
                        as: 'roles'
                    }
                ]
            });
  
            if (s_registeredUser) {
                let userDetails: WebsiteBoilerplate.UserDetails = {
                    displayName: (s_registeredUser.displayNames && s_registeredUser.displayNames[0] ? s_registeredUser.displayNames[0].displayName : ''),
                    displayNameIndex: (s_registeredUser.displayNames && s_registeredUser.displayNames[0] ? s_registeredUser.displayNames[0].displayNameIndex : -1),
                    pfp: (s_registeredUser.profilePictures && s_registeredUser.profilePictures[0] ? `i/u/${uniqueId}/${s_registeredUser.profilePictures[0].fileName}` : 'i/s/pfpDefault.svgz'),
                    roles: (s_registeredUser.roles ? s_registeredUser.roles.map(role => role.roleName) : []),
                    uniqueId
                };

                if (includeEmail) {
                    userDetails.email = s_registeredUser.email;
                }

                if (getConnectionTypes) {
                    let currentUserId: number | undefined = await this.getUserIdForUniqueId(currentUniqueId!);

                    if (currentUserId) {
                        let s_incomingConnections: UserConnectionInstance[] = await s_registeredUser.getIncomingConnections({
                            where: {
                                requestedUserId: currentUserId
                            },
                            include: {
                                model: db.UserConnectionType,
                                as: 'connectionTypes'
                            }
                        });

                        if (s_incomingConnections.length > 0) {
                            let connectionTypes: WebsiteBoilerplate.UserConnectionTypeDictionary;

                            if (s_incomingConnections[0].connectionTypes) {
                                connectionTypes = s_incomingConnections[0].connectionTypes.reduce((previousValue, connectionType) => ({
                                    ...previousValue,
                                    [connectionType.displayName]: true
                                }), {});
                            }
                            else {
                                connectionTypes = {};
                            }

                            userDetails.connectionTypes = connectionTypes;
                        }
                    }
                }

                return userDetails;
            }
        }
        catch (err) {
            console.error(`Error looking up details for user ${uniqueId}:\n${err.message}`);
        }

        /* TypeORM
        try {
            let getConnectionTypes = currentId && currentId !== uniqueId;

            let userRepository: Repository<User> = this.getUserRepository();
            let selectQB: SelectQueryBuilder<User> = userRepository.createQueryBuilder('u')
                .leftJoinAndSelect('u.displayNames', 'dn', 'dn.isActive = 1')
                .leftJoinAndSelect('u.profilePictures', 'pfp')
                .leftJoinAndSelect('u.roles', 'role')
                .where('u.uniqueId = :uniqueId', {uniqueId})
                .orderBy('pfp.id', 'DESC');

            if (getConnectionTypes) {
                let currentUserId: number | undefined = await this.getUserIdForUniqueId(currentId!);

                if (currentUserId) {
                    selectQB = selectQB.leftJoinAndSelect('u.incomingConnections', 'ic', 'ic.requestedUserId = :currentUserId', {currentUserId})
                        .leftJoinAndSelect('ic.connectionTypes', 'ct');
                }
            }

            let user: User | undefined = await selectQB.getOne();
            
            if (user) {
                let userDetails: WebsiteBoilerplate.UserDetails = {
                    displayName: (user.displayNames[0] ? user.displayNames[0].displayName : ''),
                    displayNameIndex: (user.displayNames[0] ? user.displayNames[0].displayNameIndex : -1),
                    pfp: (user.profilePictures[0] ? `i/u/${uniqueId}/${user.profilePictures[0].fileName}` : 'i/s/pfpDefault.svgz'),
                    roles: (user.roles.map(role => role.roleName)),
                    uniqueId
                };

                if (includeEmail) {
                    userDetails.email = user.email;
                }

                if (getConnectionTypes && user.incomingConnections.length > 0) {
                    let connectionTypes: WebsiteBoilerplate.UserConnectionTypeDictionary = user.incomingConnections[0].connectionTypes.reduce((previousValue, connectionType) => ({
                        ...previousValue,
                        [connectionType.displayName]: true
                    }), {});

                    userDetails.connectionTypes = connectionTypes;
                }

                return userDetails;
            }
        }
        catch (err) {
            console.error(`Error looking up details for user ${uniqueId}:\n${err.message}`);
        }*/

        return null;
    }

    async checkUserForRole(uniqueId: string, roleName: string): Promise<Boolean> {
        try
        {
            let s_registeredUser: UserInstance | null = await db.User.findOne({
                where: {
                    uniqueId
                },
                include: {
                    model: db.Role,
                    as: 'roles',
                    required: true,
                    where: {
                        roleName
                    }
                }
            });

            if (s_registeredUser) {
                return true;
            }
        }
        catch (err) {
            console.error(`Error checking role (${roleName}) for user ${uniqueId}:\n${err.message}`);
        }

        /* TypeORM
        try {
            let userRepository: Repository<User> = this.getUserRepository();
            let user: User | undefined = await userRepository.findOne({uniqueId}, {relations: ['roles']});

            if (user) {
                let roles: Role[] = user.roles;
                
                if (roles.length > 0 && roles[0].roleName === roleName) {
                    return true;
                }
            }
        }
        catch (err) {
            console.error(`Error checking role (${roleName}) for user ${uniqueId}:\n${err.message}`);
        }*/

        return false;
    }

    async searchUsers(userId: string, displayNameFilter: string, displayNameIndexFilter: number, pageNumber: number, excludeConnections: Boolean): Promise<WebsiteBoilerplate.UserSearchResults | null> {
        try {
            let queryOptions: ObjectLiteral = {
                attributes: [
                    'displayName',
                    'displayNameIndex'
                ],
                where: {
                    isActive: 1
                },
                include: [
                    {
                        model: db.User,
                        as: 'registeredUser',
                        required: true,
                        attributes: ['uniqueId'],
                        include: [
                            {
                                model: db.ProfilePicture,
                                as: 'profilePictures',
                                required: false,
                                on: {
                                    id: {
                                        [Op.eq]: Sequelize.literal('(select `id` FROM `profile_picture` where `profile_picture`.`registered_user_id` = `registeredUser`.`id` order by `profile_picture`.`id` desc limit 1)')
                                    }
                                },
                                attributes: [
                                    'mimeType',
                                    'smallFileName'
                                ]
                            }
                        ]
                    }
                ],
                order: [
                    ['displayName', 'ASC'], 
                    ['displayNameIndex', 'ASC']
                ],
                offset: pageNumber * Constants.DB_USER_FETCH_PAGE_SIZE,
                limit: Constants.DB_USER_FETCH_PAGE_SIZE,
                subQuery: false // See below
            };

            /* subQuery
                This field is apparently not documented, but it's required in this case due to limit being used
                in conjunction with having the where clause on the Profile Picture Join. Without this set to
                false, it creates a subquery for the DisplayName that it tries to select from, then for some odd
                reason, it fails to accept the table aliases in the select in the where clause even though the
                generated query runs fine in MySQL Workbench.

                https://stackoverflow.com/questions/23312868/unknown-column-error-in-sequelize-when-using-limit-and-include-options
                https://github.com/sequelize/sequelize/issues/9869#issuecomment-469823359

            */

            if (displayNameFilter) {
                queryOptions.where.displayName = {
                    [Op.like]: `${displayNameFilter.replace(/[%_]/g,'\\$1')}%`
                };
            }

            if (displayNameIndexFilter >= 0) {
                queryOptions.where = {
                    ...queryOptions.where,
                    [Op.and]: [
                        Sequelize.where(Sequelize.cast(Sequelize.col('displayNameIndex'), 'char'), {
                            [Op.like]: `${displayNameIndexFilter}%`
                        })
                    ]
                };
            }

            if (excludeConnections) {
                let userQueryOptions: ObjectLiteral = queryOptions.include[0];

                userQueryOptions.include = [
                    ...userQueryOptions.include,
                    {
                        model: db.UserConnection,
                        as: 'outgoingConnections',
                        required: false,
                        where: {
                            id: {
                                [Op.is]: null
                            }
                        }
                    },
                    {
                        model: db.UserConnection,
                        as: 'incomingConnections',
                        required: false,
                        include: [
                            {
                                model: db.User,
                                as: 'requestedUser',
                                required: false,
                                where: {
                                    [Op.or]: [
                                        {
                                            uniqueId: {
                                                [Op.is]: null
                                            }
                                        },
                                        {
                                            uniqueId: {
                                                [Op.ne]: userId
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                ];

                userQueryOptions.where = {
                    uniqueId: {
                        [Op.ne]: userId
                    }
                };
            }

            let {rows, count}: {rows: DisplayNameInstance[]; count: number} = await db.DisplayName.findAndCountAll(queryOptions);

            let results: WebsiteBoilerplate.UserSearchResults = {
                currentPage: pageNumber,
                total: count,
                users: rows.map(displayName => {
                    return {
                        displayName: displayName.displayName, 
                        displayNameIndex: displayName.displayNameIndex, 
                        uniqueId: displayName.registeredUser!.uniqueId,
                        pfpSmall: (displayName.registeredUser!.profilePictures && displayName.registeredUser!.profilePictures[0] ? `i/u/${displayName.registeredUser!.uniqueId}/${displayName.registeredUser!.profilePictures[0].smallFileName}` : 'i/s/pfpDefault.svgz'),
                    };
                })
            };

            return results;
        }
        catch (err) {
            console.error(`An error occurred while looking up users, Display Name: ${displayNameFilter}, Index: ${displayNameIndexFilter}\n${err.message}`);
        }
        
        /* TypeORM
        try {
            let displayNameRepository: Repository<DisplayName> = this.getDisplayNameRepository();
            // Could add an isActive to pfp so I wouldn't have to do the join top 1 condition, would make the code more flexible
            let selectQB: SelectQueryBuilder<DisplayName> = displayNameRepository.createQueryBuilder('dn')
                .select('dn.id') // This is necessary due to a bug with TypeORM trying to do an alias for getting the first x results
                    .addSelect('dn.displayName', 'dn_display_name')
                    .addSelect('dn.displayNameIndex', 'dn_display_name_index')
                    .addSelect('u.uniqueId', 'u_unique_id')
                    .addSelect('pfp.mimeType', 'pfp_mime_type')
                    .addSelect('pfp.smallFileName', 'pfp_small_file_name')
                .innerJoin('dn.registeredUser', 'u')
                    .leftJoin('u.profilePictures', 'pfp', '`pfp`.`id` = (select id FROM profile_picture where profile_picture.registered_user_id = u.id order by profile_picture.id desc limit 1)')
                .where('dn.isActive = 1');
            
            if (displayNameFilter) {
                selectQB = selectQB.andWhere('dn.displayName like :displayNameEscaped', {displayNameEscaped: `${displayNameFilter.replace(/[%_]/g,'\\$1')}%`});
            }

            if (displayNameIndexFilter >= 0) {
                selectQB = selectQB.andWhere('convert(dn.displayNameIndex, char) like :displayNameIndex', {displayNameIndex: `${displayNameIndexFilter}%`})
            }

            if (excludeConnections) {
                selectQB = selectQB.leftJoin('u.outgoingConnections', 'oc')
                .leftJoin('u.incomingConnections', 'ic')
                .leftJoin('ic.requestedUser', 'ru')
                .andWhere('u.uniqueId != :userId', {userId})
                .andWhere(new Brackets(qb => {
                    qb.where('ru.uniqueId is null')
                        .orWhere('ru.uniqueId != :userId', {userId})
                }))
                .andWhere('oc.id is null');
            }

            selectQB = selectQB.orderBy('dn.displayName', 'ASC')
                .addOrderBy('dn.displayNameIndex', 'ASC');

            let [displayNames, total]: [DisplayName[], number] = await selectQB.skip(pageNumber * Constants.DB_USER_FETCH_PAGE_SIZE).take(Constants.DB_USER_FETCH_PAGE_SIZE).getManyAndCount();
            let results: WebsiteBoilerplate.UserSearchResults = {
                currentPage: pageNumber,
                total,
                users: displayNames.map(displayName => {
                    return {
                        displayName: displayName.displayName, 
                        displayNameIndex: displayName.displayNameIndex, 
                        uniqueId: displayName.registeredUser.uniqueId,
                        pfpSmall: (displayName.registeredUser.profilePictures[0] ? `i/u/${displayName.registeredUser.uniqueId}/${displayName.registeredUser.profilePictures[0].smallFileName}` : 'i/s/pfpDefault.svgz'),
                    };
                })
            };

            return results;
        }
        catch (err) {
            console.error(`An error occurred while looking up users, Display Name: ${displayNameFilter}, Index: ${displayNameIndexFilter}\n${err.message}`);
        }*/

        return null;        
    }

    async getOutgoingConnections(uniqueId: string, specificConnectionId?: string): Promise<WebsiteBoilerplate.UserConnectionDetails> {
        try {
            let connectionTypes: WebsiteBoilerplate.UserConnectionTypeDictionary = await this.getConnectionTypeDict();
            
            let s_registeredUser: UserInstance | null = await db.User.findOne({
                where: {
                    uniqueId
                },
                include: [
                    {
                        model: db.UserConnection,
                        as: 'outgoingConnections',
                        required: true,
                        include: [
                            {
                                model: db.User,
                                as: 'connectedUser',
                                required: true,
                                include: [
                                    {
                                        model: db.DisplayName,
                                        as: 'displayNames',
                                        where: {
                                            isActive: 1
                                        }
                                    },
                                    {
                                        model: db.ProfilePicture,
                                        as: 'profilePictures',
                                        order: [['id', 'DESC']]
                                    }
                                ]
                            },
                            {
                                model: db.UserConnectionType,
                                as: 'connectionTypes'
                            }
                        ]
                    },
                ]
            });
            
            if (s_registeredUser && s_registeredUser.outgoingConnections) {
                return s_registeredUser.outgoingConnections.reduce((previousValue, connection) => {
                    let connectedUser: UserInstance | undefined = connection.connectedUser;

                    let userConnectionTypes: WebsiteBoilerplate.UserConnectionTypeDictionary = {};
                    
                    if (connection.connectionTypes) {
                        userConnectionTypes = connection.connectionTypes.reduce((previousValue, connectionType) => ({
                            ...previousValue,
                            [connectionType.displayName]: true
                        }), {});
                    }

                    return {
                        ...previousValue,
                        [connectedUser!.uniqueId]: {
                            displayName: (connectedUser!.displayNames && connectedUser!.displayNames[0] ? connectedUser!.displayNames[0].displayName : ''),
                            displayNameIndex: (connectedUser!.displayNames && connectedUser!.displayNames[0] ? connectedUser!.displayNames[0].displayNameIndex : -1),
                            pfpSmall: (connectedUser!.profilePictures && connectedUser!.profilePictures[0] ? `i/u/${uniqueId}/${connectedUser!.profilePictures[0].smallFileName}` : 'i/s/pfpDefault.svgz'),
                            isMutual: connection.isMutual,
                            connectionTypes: {...connectionTypes, ...userConnectionTypes}
                        }
                    }
                }, {});
            }
        }
        catch (err) {
            console.error(`Error looking up connections for uniqueId ${uniqueId}:\n${err.message}`);
        }

        /* TypeORM
        try {
            let connectionTypes: WebsiteBoilerplate.UserConnectionTypeDictionary = await this.getConnectionTypeDict();
            let userRepository: Repository<User> = this.getUserRepository();
            let user: User | undefined = await userRepository.createQueryBuilder('u')
                .innerJoinAndSelect('u.outgoingConnections', 'oc')
                .innerJoinAndSelect('oc.connectedUser', 'cu')
                .leftJoinAndSelect('cu.displayNames', 'dn', 'dn.isActive = 1')
                .leftJoinAndSelect('cu.profilePictures', 'pfp')
                .leftJoinAndSelect('oc.connectionTypes', 'uct')
                .where('u.uniqueId = :uniqueId', {uniqueId})
                .getOne();
            
            if (user) {
                return user.outgoingConnections.reduce((previousValue, connection) => {
                    let connectedUser: User = connection.connectedUser;

                    let userConnectionTypes: WebsiteBoilerplate.UserConnectionTypeDictionary = connection.connectionTypes.reduce((previousValue, connectionType) => ({
                        ...previousValue,
                        [connectionType.displayName]: true
                    }), {});


                    return {
                        ...previousValue,
                        [connectedUser.uniqueId]: {
                            displayName: (connectedUser.displayNames[0] ? connectedUser.displayNames[0].displayName : ''),
                            displayNameIndex: (connectedUser.displayNames[0] ? connectedUser.displayNames[0].displayNameIndex : -1),
                            pfpSmall: (connectedUser.profilePictures[0] ? `i/u/${uniqueId}/${connectedUser.profilePictures[0].smallFileName}` : 'i/s/pfpDefault.svgz'),
                            isMutual: connection.isMutual,
                            connectionTypes: {...connectionTypes, ...userConnectionTypes}
                        }
                    }
                }, {});
            }
        }
        catch (err) {
            console.error(`Error looking up connections for uniqueId ${uniqueId}:\n${err.message}`);
        }*/

        return {};
    }

    async getIncomingConnections(uniqueId: string, specificConnectionId?: string): Promise<WebsiteBoilerplate.UserConnectionDetails> {
        try {
            let s_registeredUser: UserInstance | null = await db.User.findOne({
                where: {
                    uniqueId
                },
                include: [
                    {
                        model: db.UserConnection,
                        as: 'incomingConnections',
                        required: true,
                        include: [
                            {
                                model: db.User,
                                as: 'requestedUser',
                                required: true,
                                include: [
                                    {
                                        model: db.DisplayName,
                                        as: 'displayNames',
                                        required: false,
                                        where: {
                                            isActive: 1
                                        }
                                    },
                                    {
                                        model: db.ProfilePicture,
                                        as: 'profilePictures',
                                        required: false,
                                        order: ['id', 'DESC']
                                    }
                                ]
                            }
                        ]
                    }
                ]
            });
            
            if (s_registeredUser && s_registeredUser.incomingConnections) {
                return s_registeredUser.incomingConnections.reduce((previousValue, connection) => {
                    let requestedUser: UserInstance = connection.requestedUser!;

                    return {
                        ...previousValue,
                        [requestedUser.uniqueId]: {
                            displayName: (requestedUser.displayNames && requestedUser.displayNames[0] ? requestedUser.displayNames[0].displayName : ''),
                            displayNameIndex: (requestedUser.displayNames && requestedUser.displayNames[0] ? requestedUser.displayNames[0].displayNameIndex : -1),
                            pfpSmall: (requestedUser.profilePictures && requestedUser.profilePictures[0] ? `i/u/${uniqueId}/${requestedUser.profilePictures[0].smallFileName}` : 'i/s/pfpDefault.svgz'),
                            isMutual: connection.isMutual,
                            connectionTypes: {}
                        }
                    }
                }, {});
            }
        }
        catch (err) {
            console.error(`Error looking up connections for uniqueId ${uniqueId}:\n${err.message}`);
        }

        /* TypeORM
        try {
            let connectionTypes: WebsiteBoilerplate.UserConnectionTypeDictionary = await this.getConnectionTypeDict();
            let userRepository: Repository<User> = this.getUserRepository();
            let user: User | undefined = await userRepository.createQueryBuilder('u')
                .innerJoinAndSelect('u.incomingConnections', 'ic')
                .innerJoinAndSelect('ic.requestedUser', 'ru')
                .leftJoinAndSelect('ru.displayNames', 'dn', 'dn.isActive = 1')
                .leftJoinAndSelect('ru.profilePictures', 'pfp')
                .where('u.uniqueId = :uniqueId', {uniqueId})
                .getOne();
            
            if (user) {
                return user.incomingConnections.reduce((previousValue, connection) => {
                    let requestedUser: User = connection.requestedUser;

                    return {
                        ...previousValue,
                        [requestedUser.uniqueId]: {
                            displayName: (requestedUser.displayNames[0] ? requestedUser.displayNames[0].displayName : ''),
                            displayNameIndex: (requestedUser.displayNames[0] ? requestedUser.displayNames[0].displayNameIndex : -1),
                            pfpSmall: (requestedUser.profilePictures[0] ? `i/u/${uniqueId}/${requestedUser.profilePictures[0].smallFileName}` : 'i/s/pfpDefault.svgz'),
                            isMutual: connection.isMutual,
                            connectionTypes: {}
                        }
                    }
                }, {});
            }
        }
        catch (err) {
            console.error(`Error looking up connections for uniqueId ${uniqueId}:\n${err.message}`);
        }*/

        return {};
    }

    async getConnectionTypeDict(): Promise<WebsiteBoilerplate.UserConnectionTypeDictionary> {
        //##TODO: Cache Results
        try {
            let s_connectionTypes: UserConnectionTypeInstance[] = await this.gets_ConnectionTypes();

            let connectionTypesDict: WebsiteBoilerplate.UserConnectionTypeDictionary = s_connectionTypes.reduce((previousValue, currentValue) => {
                return {
                    ...previousValue,
                    [currentValue.displayName]: false
                }
            }, {});

            return connectionTypesDict;
        }
        catch (err) {
            console.error(`Error looking up connection types:\n${err.message}`);
        }

        /* TypeORM
        try {
            let connectionTypeRepository: Repository<UserConnectionType> = this.getUserConnectionTypeRepository();

            let connectionTypes: UserConnectionType[] = await connectionTypeRepository.createQueryBuilder('uct')
                .cache(Constants.CONNECTION_TYPES_CACHE_HOURS * 60 * 60 * 1000)
                .getMany();

            let connectionTypesDict: WebsiteBoilerplate.UserConnectionTypeDictionary = connectionTypes.reduce((previousValue, currentValue) => {
                return {
                    ...previousValue,
                    [currentValue.displayName]: false
                }
            }, {});

            return connectionTypesDict;
        }
        catch (err) {
            console.error(`Error looking up connection types:\n${err.message}`);
        }*/

        return {};
    }

    async gets_ConnectionTypes(): Promise<UserConnectionTypeInstance[]> {
        //##TODO: Cache Results
        try {
            let s_userConnectionTypes: UserConnectionTypeInstance[] | null = await db.UserConnectionType.findAll();

            if (s_userConnectionTypes)
            {
                return s_userConnectionTypes;
            }
        }
        catch (err) {
            console.error(`Error looking up connection types:\n${err.message}`);
        }

        return [];
    }

    async getConnectionTypes(): Promise<UserConnectionType[]> {      
        try {
            let connectionTypeRepository: Repository<UserConnectionType> = this.getUserConnectionTypeRepository();

            let connectionTypes: UserConnectionType[] = await connectionTypeRepository.createQueryBuilder('uct')
                .cache(Constants.CONNECTION_TYPES_CACHE_HOURS * 60 * 60 * 1000)
                .getMany();

            return connectionTypes;
        }
        catch (err) {
            console.error(`Error looking up connection types:\n${err.message}`);
        }

        return [];
    }

    async removeUserConnection(currentUserUniqueId: string, connectedUserUniqueId: string): Promise<Boolean> {
        try
        {
            let s_currentUser: UserInstance | null = await this.gets_UserWithUniqueId(currentUserUniqueId);
            let s_connectedUser: UserInstance | null = await this.gets_UserWithUniqueId(connectedUserUniqueId);

            if (s_currentUser && s_connectedUser) {
                let s_userConnection: UserConnectionInstance | null = await db.UserConnection.findOne({
                    where: {
                        requestedUserId: s_currentUser.id!,
                        connectedUserId: s_connectedUser.id!
                    }
                });
                
                if (s_userConnection) {
                    await s_userConnection.destroy();
                }
                
                return true;
            }
        }
        catch (err) {
            console.error(`Error removing connection:\n${err.message}`);
        }

        /* TypeORM
        let userConnectionRepository: Repository<UserConnection> = this.getUserConnectionRepository();
        let currentUser: User | undefined = await this.getUserWithId(currentUserUniqueId);
        let connectedUser: User | undefined = await this.getUserWithId(connectedUserUniqueId);

        if (currentUser && connectedUser) {
            try
            {
                let userConnection: UserConnection | undefined = await userConnectionRepository.createQueryBuilder()
                    .where('requested_user_id = :currentUserId AND connected_user_id = :connectedUserId', {
                        currentUserId: currentUser.id,
                        connectedUserId: connectedUser.id
                    })
                    .getOne();
                
                if (userConnection) {
                    // The column names do not get converted, nor do aliases get used when doing deletes like this
                    let deleteQB: DeleteQueryBuilder<UserConnection> = userConnectionRepository.createQueryBuilder()
                        .delete()
                        .from(UserConnection)
                        .where('id = :id', {
                            id: userConnection.id
                        });

                    let result: DeleteResult = await deleteQB.execute();

                    console.log(`${result.affected ? result.affected : 0} rows affected by User Connection Delete`);

                    if (result.affected && result.affected > 0) {
                        let inverseConnection: UserConnection | undefined = await userConnectionRepository.createQueryBuilder()
                            .where('requested_user_id = :connectedUserId AND connected_user_id = :currentUserId', {
                                connectedUserId: connectedUser.id,
                                currentUserId: currentUser.id
                            })
                            .getOne();
                      
                        if (inverseConnection) {
                            inverseConnection.isMutual = false;
                            userConnectionRepository.save(inverseConnection);
                        }
                    }
                }
                
                return true;
            }
            catch (err) {
                console.error(`Error removing connection:\n${err.message}`);
            }
        }*/

        return false;
    }

    async updateUserConnection(uniqueId: string, outgoingConnectionUpdates: WebsiteBoilerplate.UserConnectionDetails): Promise<Boolean> {
        try
        {
            let s_connectedUserUniqueId: string = Object.keys(outgoingConnectionUpdates)[0];
            let s_connectedUser: UserInstance | null = await this.gets_UserWithUniqueId(s_connectedUserUniqueId);

            if (s_connectedUser) {
                let s_currentUser: UserInstance | null = await db.User.findOne({
                    where: {
                        uniqueId
                    },
                    include: [
                        {
                            model: db.UserConnection,
                            as: 'outgoingConnections',
                            required: false,
                            where: {
                                connectedUserId: s_connectedUser.id!
                            },
                            include: [
                                {
                                    model: db.UserConnectionType,
                                    as: 'connectionTypes',
                                    required: false
                                },
                                {
                                    model: db.User,
                                    as: 'connectedUser',
                                    required: false
                                }
                            ]
                        }
                    ]
                });

                if (s_currentUser && s_currentUser.outgoingConnections) {
                    let outgoingConnections: UserConnectionInstance[] = s_currentUser.outgoingConnections;
                    let s_allConnectionTypes: UserConnectionTypeInstance[] = await this.gets_ConnectionTypes();
                    let { connectionTypes } : { connectionTypes: WebsiteBoilerplate.UserConnectionTypeDictionary} = outgoingConnectionUpdates[s_connectedUserUniqueId];

                    if (outgoingConnections.length > 0) { // This is an existing connection, modify the types if necessary
                        let existingConnection: UserConnectionInstance = outgoingConnections[0];
                        let oldConnectionTypes: UserConnectionTypeInstance[] | undefined = existingConnection.connectionTypes;

                        // Remove any connections that are no longer selected
                        if (oldConnectionTypes && oldConnectionTypes.length > 0){
                            let removeConnectionTypes: UserConnectionTypeInstance[] = oldConnectionTypes.filter(oldConnectionType => connectionTypes[oldConnectionType.displayName] === false);
                            
                            if (removeConnectionTypes.length > 0) {
                                await existingConnection.removeConnectionTypes(removeConnectionTypes);
                            }
                        }

                        let addConnectionTypes: UserConnectionTypeInstance[] = [];

                        Object.keys(connectionTypes).forEach((key: string) => {
                            let isSelected: Boolean = connectionTypes[key];

                            if (isSelected) {
                                if (!oldConnectionTypes!.find(elem => elem.displayName === key)) {
                                    // If it's selected and they don't currently have that type, it needs to be added
                                    let connectionTypeRecord: UserConnectionTypeInstance | undefined = s_allConnectionTypes.find(elem => elem.displayName === key);

                                    if (connectionTypeRecord) {
                                        addConnectionTypes.push(connectionTypeRecord);
                                    }
                                }
                            }
                        });

                        if (addConnectionTypes.length > 0) {
                            await existingConnection.addConnectionTypes(addConnectionTypes);
                        }

                        return true;
                    }
                    else {
                        let s_newConnection: UserConnectionInstance = await db.UserConnection.create({
                            requestedUserId: s_currentUser.id!,
                            connectedUserId: s_connectedUser.id!
                        });

                        if (Object.keys(connectionTypes).length) {
                            let addConnectionTypes: UserConnectionTypeInstance[] = s_allConnectionTypes.filter(connectionType => connectionTypes[connectionType.displayName]);

                            if (addConnectionTypes.length > 0) {
                                await s_newConnection.addConnectionTypes(addConnectionTypes);
                            }
                        }

                        return true;
                    }
                }
            }
        }
        catch (err)
        {
            console.error(`Failed to update outgoing connection for user ${uniqueId}:\n${err.message}`);
        }

        /* TypeORM
        // Need to improve the variable names in this method and probably create some additional variables for cleanup
        let allConnectionTypes: UserConnectionType[] = await this.getConnectionTypes();
        let userRepository: Repository<User> = this.getUserRepository();
        let userConnectionRepository: Repository<UserConnection> = this.getUserConnectionRepository();
        let connectedUserUniqueID: string = Object.keys(outgoingConnection)[0];
        let connectedUser: User | undefined = await this.getUserWithId(connectedUserUniqueID);

        if (connectedUser) {
            let currentUser: User | undefined = await userRepository.createQueryBuilder('u')
                .leftJoinAndSelect('u.outgoingConnections', 'uc', 'uc.connectedUserId = :connectedUserId', {connectedUserId: connectedUser.id})
                .leftJoinAndSelect('uc.connectionTypes', 'ct')
                .leftJoinAndSelect('uc.connectedUser', 'cu')
                .where('u.uniqueId = :uniqueId', {uniqueId})
                .getOne();

            if (currentUser) {
                let incomingConnection: UserConnection | undefined = await userConnectionRepository.createQueryBuilder('uc')
                    .where('uc.requestedUserId = :connectedUserId AND uc.connectedUserId = :currentUserId', {
                        connectedUserId: connectedUser.id,
                        currentUserId: currentUser.id
                    })
                    .getOne();

                let outgoingConnections: UserConnection[] = currentUser.outgoingConnections;
                let changesMade: Boolean = false;

                if (outgoingConnections.length > 0) { // This is an existing connection, modify the types if necessary
                    let { connectionTypes } : { connectionTypes: WebsiteBoilerplate.UserConnectionTypeDictionary} = outgoingConnection[connectedUserUniqueID];
                    let connectionTypeCount: number = currentUser.outgoingConnections[0].connectionTypes.length;
                    let atLeastOneConnectionType: Boolean = false;

                    // Remove any connections that are no longer selected
                    currentUser.outgoingConnections[0].connectionTypes = currentUser.outgoingConnections[0].connectionTypes.filter(connectionType => connectionTypes[connectionType.displayName]);

                    if (connectionTypeCount != currentUser.outgoingConnections[0].connectionTypes.length) {
                        changesMade = true;
                    }

                    let currentConnectionTypes: UserConnectionType[] = currentUser.outgoingConnections[0].connectionTypes;

                    Object.keys(connectionTypes).forEach((key: string) => {
                        let isSelected: Boolean = connectionTypes[key];

                        if (isSelected) {
                            if (!currentConnectionTypes.find(elem => elem.displayName === key)) {
                                // If it's selected and they don't currently have that type, it needs to be added
                                let connectionTypeRecord: UserConnectionType | undefined = allConnectionTypes.find(elem => elem.displayName === key);

                                if (connectionTypeRecord) {
                                    currentUser!.outgoingConnections[0].connectionTypes.push(connectionTypeRecord);
                                    changesMade = true;
                                }
                            }

                            atLeastOneConnectionType = true;
                        }
                    });

                    if (atLeastOneConnectionType && incomingConnection) {
                        currentUser.outgoingConnections[0].isMutual = true;
                    }
                    else if (!atLeastOneConnectionType) {
                        currentUser.outgoingConnections[0].isMutual = false;
                    }
                }
                else {
                    let newConnection: UserConnection = new UserConnection();

                    newConnection.requestedUser = currentUser;
                    newConnection.connectedUser = connectedUser;

                    let newConnectionTypes: WebsiteBoilerplate.UserConnectionTypeDictionary = outgoingConnection[connectedUserUniqueID].connectionTypes;

                    if (Object.keys(newConnectionTypes).length) {
                        newConnection.isMutual = incomingConnection ? true : false;
                        newConnection.connectionTypes = new Array<UserConnectionType>();
                        allConnectionTypes.forEach(connectionType => {
                            if (newConnectionTypes[connectionType.displayName]) {
                                newConnection.connectionTypes.push(connectionType);
                            }
                        });
                    }
                    else {
                        newConnection.isMutual = false;
                    }

                    currentUser.outgoingConnections.push(newConnection);
                    changesMade = true;
                }

                if (changesMade) {
                    let connectionsToSave: UserConnection[] = [currentUser.outgoingConnections[0]];

                    if (incomingConnection) {
                        if (incomingConnection.isMutual != currentUser.outgoingConnections[0].isMutual) {
                            incomingConnection.isMutual = currentUser.outgoingConnections[0].isMutual;
                            connectionsToSave.push(incomingConnection);
                        }
                    }
                    
                    await userConnectionRepository.save(connectionsToSave);
                }
            }
        }*/

        return false;
    }
};

export let databaseHelper: DatabaseHelper = new DatabaseHelper();