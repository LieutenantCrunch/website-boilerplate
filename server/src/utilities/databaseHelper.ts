import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import bcrypt from 'bcryptjs';

import {createConnection, Connection, Repository, ObjectLiteral, SelectQueryBuilder} from 'typeorm';
import {User} from '../entity/User';
import {ProfilePicture} from '../entity/ProfilePicture';
import {UserJWT} from '../entity/UserJWT';
import {DisplayName} from '../entity/DisplayName';
import {Role} from '../entity/Role';
import {UserConnection} from '../entity/UserConnection';
import * as Constants from '../constants/constants';
import { PasswordResetToken } from '../entity/PasswordResetToken';
import { UserConnectionType } from '../entity/UserConnectionType';

export default class DatabaseHelper {
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

    async registerNewUser(email: string, displayName: string, password: string): Promise<{id: string | null, success: Boolean}> {
        try
        {
            if (!displayName || displayName.indexOf('#') > -1) {
                return {id: null, success: false};
            }

            let userRepository: Repository<User> = this.getUserRepository();
            let salt: string = await bcrypt.genSalt(10);
            let passwordHash: string = await bcrypt.hash(password, salt);
            let uniqueID: string = uuidv4();
            let newUser: User = new User();

            newUser = {...newUser, email, passwordHash, uniqueID};

            try
            {
                let registeredUser: User = await userRepository.save(newUser);
                let results: {success: Boolean, displayNameIndex?: number, message?: string} = await this.setUserDisplayName(uniqueID, displayName);
            }
            catch(err)
            {
                console.error(`Error saving User to database: ${err.message}`);
                return {id: null, success: false};
            }

            return {id: uniqueID, success: true};
        }
        catch (err)
        {
            console.error(err.message);
            return {id: null, success: false};
        }
    }

    async updateCredentials(email: string, password: string): Promise<Boolean> {
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
        }

        return false;
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

    async validatePasswordResetToken(token: string, email: string): Promise<Boolean> {
        try
        {
            const userRepository: Repository<User> = this.getUserRepository();

            let passwordResetTokenRepository: Repository<PasswordResetToken> = this.getPasswordResetTokenRepository();
            let foundToken: PasswordResetToken | undefined = await passwordResetTokenRepository.createQueryBuilder('rpt')
                .innerJoinAndSelect('rpt.registeredUser', 'user')
                .where('rpt.token = :token AND user.email = :email', {token, email})
                .getOne();

            if (foundToken) {
                return true;
            }
        }
        catch (err)
        {
            console.error(err.message);
        }

        return false;
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

    async getPFPFileNameForUserId(uniqueID: string, originalSize?: Boolean): Promise<string | null> {
        let userRepository: Repository<User> = this.getUserRepository();
        let registeredUser: User | undefined = undefined;

        try
        {
            registeredUser = await userRepository.createQueryBuilder('u')
                .where('u.uniqueID = :uniqueID', {uniqueID})
                .innerJoinAndSelect('u.profilePictures', 'pfp')
                .orderBy('pfp.id', 'DESC')
                .getOne();
        }
        catch (err)
        {
            console.error(`Error looking up user with id ${uniqueID}: ${err.message}`);
        }
        
        if (registeredUser && registeredUser.profilePictures.length > 0) {
            let profilePicture: ProfilePicture = registeredUser.profilePictures[0];
            
            return originalSize ? profilePicture.fileName : profilePicture.smallFileName;
        }

        return null;
    }

    async addJWTToUser(uniqueID: string, jwtInfo: {jti: string, expirationDate: Date}): Promise<{success: Boolean}> {
        try
        {
            let userRepository: Repository<User> = this.getUserRepository();
            let registeredUser: User | undefined = undefined;

            try
            {
                registeredUser = await userRepository.findOne({uniqueID}, {relations: ['activeJWTs']});
            }
            catch (err)
            {
                console.error(`Error looking up user with id ${uniqueID}: ${err.message}`);
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
            console.error(`Error adding new JWT to user ${uniqueID}: ${err.message}`);
        }

        return {success: false};
    }

    async extendJWTForUser(uniqueID: string, jwtInfo: {jti: string, expirationDate: Date}): Promise<{success: Boolean}> {
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
                console.error(`Error looking up user with id ${uniqueID}: ${err.message}`);
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
            console.error(`Error extending JWT for user ${uniqueID}: ${err.message}`);
        }

        return {success: false};
    }

    async validateJWTForUserId(uniqueID: string, jti: string): Promise<Boolean> {
        let userRepository: Repository<User> = this.getUserRepository();
        let registeredUser: User | undefined = undefined;

        try
        {
            registeredUser = await userRepository.createQueryBuilder('user')
            .innerJoinAndSelect('user.activeJWTs', 'jwt')
            .where('jwt.jti = :jti AND jwt.isValid = 1 AND jwt.expirationDate > now()', {jti})
            .getOne();
        }
        catch (err)
        {
            console.error(`Error looking up user with id ${uniqueID}: ${err.message}`);
        }
        
        if (registeredUser) {
            return true;
        }

        return false;
    }

    async invalidateJWTsForUser(uniqueID: string, mode: number = Constants.INVALIDATE_TOKEN_MODE.SPECIFIC, jti?: string): Promise<{success: Boolean}> {
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
                console.error(`Error looking up user with id ${uniqueID}: ${err.message}`);
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

    async getUserEmail(uniqueID: string): Promise<string | null> {
        try {
            let userRepository: Repository<User> = this.getUserRepository();
            let user: User | undefined = await userRepository.findOne({uniqueID});

            if (user) {
                return user.email;
            }
        }
        catch (err) {
            console.error(`Error getting email for user ${uniqueID}:\n${err.message}`);
        }

        return null;
    }

    async setUserEmail(uniqueID: string, email: string): Promise<{success: Boolean, message?: string}> {
        try {
            let userRepository: Repository<User> = this.getUserRepository();
            let user: User | undefined = await userRepository.findOne({uniqueID});

            if (user) {
                user.email = email;
                await userRepository.save(user);

                return {success: true};
            }

            return {success: false, message: `User not found.`};
        }
        catch (err) {
            return {success: false, message: `Error changing email for user ${uniqueID}:\n${err.message}`};
        }
    }

    async getUserDisplayName(uniqueID: string): Promise<string | null> {
        try {
            let userRepository: Repository<User> = this.getUserRepository();
            let user: User | undefined = await userRepository.createQueryBuilder('u')
                .innerJoinAndSelect('u.displayNames', 'dn')
                .where('u.uniqueID = :uniqueID AND dn.isActive = 1', {uniqueID})
                .getOne();

            if (user) {
                return user.displayNames[0].displayName;
            }
        }
        catch (err) {
            console.error(`Error getting display name for user ${uniqueID}:\n${err.message}`);
        }

        return null;
    }

    async setUserDisplayName(uniqueID: string, displayName: string): Promise<{success: Boolean, displayNameIndex?: number, message?: string}> {
        try
        {
            let userRepository: Repository<User> = this.getUserRepository();
            let registeredUser: User | undefined = await userRepository.findOne({uniqueID});

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
        }
    }

    async verifyUserDisplayName(uniqueID: string, displayName: string): Promise<{success: Boolean, message: string}> {
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
                    .innerJoinAndSelect('dn.registeredUser', 'u', `u.uniqueID = :uniqueID`, {uniqueID})
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
        }

        return {success: false, message: `Error validating Display Name ${displayName} for user with unique ID ${uniqueID}, check log.`};
    }

    async getUserDetails(uniqueID: string): Promise<WebsiteBoilerplate.UserDetails | null> {
        try {
            let userRepository: Repository<User> = this.getUserRepository();
            let user: User | undefined = await userRepository.createQueryBuilder('u')
                .leftJoinAndSelect('u.displayNames', 'dn', 'dn.isActive = 1')
                .leftJoinAndSelect('u.profilePictures', 'pfp')
                .leftJoinAndSelect('u.roles', 'role')
                .where('u.uniqueID = :uniqueID', {uniqueID})
                .orderBy('pfp.id', 'DESC')
                .getOne();
            
            if (user) {
                let userDetails: WebsiteBoilerplate.UserDetails = {
                    email: user.email,
                    displayName: (user.displayNames[0] ? user.displayNames[0].displayName : ''),
                    displayNameIndex: (user.displayNames[0] ? user.displayNames[0].displayNameIndex : -1),
                    pfp: (user.profilePictures[0] ? `i/u/${uniqueID}/${user.profilePictures[0].fileName}` : 'i/s/pfpDefault.svgz'),
                    roles: (user.roles.map(role => role.roleName)),
                    uniqueID
                };

                return userDetails;
            }
        }
        catch (err) {
            console.error(`Error looking up details for user ${uniqueID}:\n${err.message}`);
        }

        return null;
    }

    async checkUserForRole(uniqueID: string, roleName: string): Promise<Boolean> {
        try {
            let userRepository: Repository<User> = this.getUserRepository();
            let user: User | undefined = await userRepository.findOne({uniqueID}, {relations: ['roles']});

            if (user) {
                let roles: Role[] = user.roles;
                
                if (roles.length > 0 && roles[0].roleName === roleName) {
                    return true;
                }
            }
        }
        catch (err) {
            console.error(`Error checking role (${roleName}) for user ${uniqueID}:\n${err.message}`);
        }

        return false;
    }

    async searchUsers(displayNameFilter: string, displayNameIndexFilter: number, pageNumber: number): Promise<WebsiteBoilerplate.UserSearchResults | null> {
        try {
            let displayNameRepository: Repository<DisplayName> = this.getDisplayNameRepository();
            let selectQB: SelectQueryBuilder<DisplayName> = displayNameRepository.createQueryBuilder('dn')
                .innerJoinAndSelect('dn.registeredUser', 'u')
                .leftJoinAndSelect('u.profilePictures', 'pfp')
                .where('dn.isActive = 1');
            
            if (displayNameFilter) {
                selectQB = selectQB.andWhere('dn.displayName like :displayNameEscaped', {displayNameEscaped: `${displayNameFilter.replace(/[%_]/g,'\\$1')}%`});
            }

            if (displayNameIndexFilter >= 0) {
                selectQB = selectQB.andWhere('convert(dn.displayNameIndex, char) like :displayNameIndex', {displayNameIndex: `${displayNameIndexFilter}%`})
            }

            selectQB = selectQB.orderBy('pfp.id', 'DESC');

            let [displayNames, total]: [DisplayName[], number] = await selectQB.skip(pageNumber * Constants.DB_USER_FETCH_PAGE_SIZE).take(Constants.DB_USER_FETCH_PAGE_SIZE).getManyAndCount();
            let results: WebsiteBoilerplate.UserSearchResults = {
                currentPage: pageNumber,
                total,
                users: displayNames.map(displayName => {
                    return {
                        displayName: displayName.displayName, 
                        displayNameIndex: displayName.displayNameIndex, 
                        uniqueID: displayName.registeredUser.uniqueID,
                        pfpSmall: (displayName.registeredUser.profilePictures[0] ? `i/u/${displayName.registeredUser.uniqueID}/${displayName.registeredUser.profilePictures[0].smallFileName}` : 'i/s/pfpDefault.svgz'),
                    };
                })
            };

            return results;
        }
        catch (err) {
            console.error(`An error occurred while looking up users, Display Name: ${displayNameFilter}, Index: ${displayNameIndexFilter}\n${err.message}`);
        }

        return null;        
    }

    async getUserConnections(uniqueID: string): Promise<WebsiteBoilerplate.UserConnectionDetails> {
        try {
            let userRepository: Repository<User> = this.getUserRepository();
            let user: User | undefined = await userRepository.createQueryBuilder('u')
                .innerJoinAndSelect('u.outgoingConnections', 'oc')
                .innerJoinAndSelect('oc.connectedUser', 'cu')
                .leftJoinAndSelect('cu.displayNames', 'dn', 'dn.isActive = 1')
                .leftJoinAndSelect('cu.profilePictures', 'pfp')
                .leftJoinAndSelect('oc.connectionTypes', 'uct')
                .where('u.uniqueID = :uniqueID', {uniqueID})
                .getOne();
            
            if (user) {
                return user.outgoingConnections.reduce((previousValue, connection) => {
                    let connectedUser: User = connection.connectedUser;

                    return {
                        ...previousValue,
                        [connectedUser.uniqueID]: {
                            displayName: (connectedUser.displayNames[0] ? connectedUser.displayNames[0].displayName : ''),
                            displayNameIndex: (connectedUser.displayNames[0] ? connectedUser.displayNames[0].displayNameIndex : -1),
                            pfpSmall: (connectedUser.profilePictures[0] ? `i/u/${uniqueID}/${connectedUser.profilePictures[0].smallFileName}` : 'i/s/pfpDefault.svgz'),
                            isMutual: connection.isMutual,
                            connectionTypes: connection.connectionTypes.reduce((previousValue, connectionType) => {
                                return {
                                    ...previousValue,
                                    [connectionType.displayName]: true
                                }
                            }, {})
                        }
                    }
                }, {});
            }
        }
        catch (err) {
            console.error(`Error looking up connections for uniqueID ${uniqueID}:\n${err.message}`);
        }

        return {};
    }

    async getConnectionTypes(): Promise<WebsiteBoilerplate.UserConnectionTypeDictionary> {
        try {
            let connectionTypeRepository: Repository<UserConnectionType> = this.getUserConnectionTypeRepository();

            let connectionTypes: UserConnectionType[] = await connectionTypeRepository.createQueryBuilder('uct')
                .getMany();

            let connectionTypesDictionary: WebsiteBoilerplate.UserConnectionTypeDictionary = connectionTypes.reduce((previousValue, currentValue) => {
                return {
                    ...previousValue,
                    [currentValue.displayName]: true
                }
            }, {});

            return connectionTypesDictionary;
        }
        catch (err) {
            console.error(`Error looking up connection types:\n${err.message}`);
        }

        return {};
    }
};