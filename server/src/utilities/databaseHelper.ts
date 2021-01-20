import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

import bcrypt from 'bcryptjs';

import * as Constants from '../constants/constants';

import { Op } from 'sequelize';
import { db } from '../models/_index';
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
        });
    };

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

        return false;
    }

    async invalidateJWTsForUser(uniqueId: string, mode: number = Constants.INVALIDATE_TOKEN_MODE.SPECIFIC, jti?: string): Promise<{success: Boolean}> {
        try
        {
            if (!jti) { // If we don't have an ID, then we have to expire all of them
                mode = Constants.INVALIDATE_TOKEN_MODE.ALL;
            }

            let additionalQueryOptions: {[key: string]: any;} = {};
            
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

        return false;
    }

    async searchUsers(userId: string, displayNameFilter: string, displayNameIndexFilter: number, pageNumber: number, excludeConnections: Boolean): Promise<WebsiteBoilerplate.UserSearchResults | null> {
        try {
            let queryOptions: {[key: string]: any;} = {
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
                let userQueryOptions: {[key: string]: any;} = queryOptions.include[0];

                userQueryOptions.include = [
                    ...userQueryOptions.include,
                    {
                        model: db.UserConnection,
                        as: 'outgoingConnections',
                        attributes: [],
                        required: false
                    },
                    {
                        model: db.UserConnection,
                        as: 'incomingConnections',
                        attributes: [],
                        required: false,
                        include: [
                            {
                                model: db.User,
                                as: 'requestedUser',
                                attributes: [],
                                required: false
                            }
                        ]
                    }
                ];

                // Nested columns don't use the aliases, so you have to use the actual column names
                queryOptions.where = {
                    ...queryOptions.where,
                    '$registeredUser.unique_id$': {
                        [Op.ne]: userId
                    },
                    '$registeredUser.outgoingConnections.id$': {
                        [Op.is]: null
                    },
                    '$registeredUser.incomingConnections.requestedUser.unique_id$': {
                        [Op.or]: {
                            [Op.is]: null,
                            [Op.ne]: userId
                        }
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

        return null;        
    }

    async getOutgoingConnections(uniqueId: string, specificConnectionId?: string): Promise<WebsiteBoilerplate.UserConnectionDetails> {
        try {
            let connectionTypes: WebsiteBoilerplate.UserConnectionTypeDictionary = await this.getConnectionTypeDict();

            let s_registeredUserId: number | undefined = await this.getUserIdForUniqueId(uniqueId);

            if (s_registeredUserId !== undefined) {
                let outgoingConnectionsView: UserConnectionViewInstance[] | null = await db.Views.UserConnectionView.findAll({
                    where: {
                        requestedUserId: s_registeredUserId
                    },
                    attributes: [
                        'isMutual'
                    ],
                    include: [
                        {
                            model: db.UserConnection,
                            as: 'userConnection',
                            required: true,
                            include: [
                                {
                                    model: db.User,
                                    as: 'connectedUser',
                                    attributes: [
                                        'uniqueId'
                                    ],
                                    required: true,
                                    include: [
                                        {
                                            model: db.DisplayName,
                                            as: 'displayNames',
                                            where: {
                                                isActive: 1
                                            },
                                            attributes: [
                                                'displayName',
                                                'displayNameIndex'
                                            ],
                                            required: false
                                        },
                                        {
                                            model: db.ProfilePicture,
                                            as: 'profilePictures',
                                            attributes: [
                                                'smallFileName'
                                            ],
                                            order: [['id', 'DESC']],
                                            required: false
                                        }
                                    ]
                                },
                                {
                                    model: db.UserConnectionType,
                                    as: 'connectionTypes',
                                    required: false,
                                    attributes: [
                                        'displayName'
                                    ],
                                    through: {
                                        attributes: []
                                    }
                                }
                            ]
                        }
                    ]
                });

                if (outgoingConnectionsView && outgoingConnectionsView.length > 0) {
                    return outgoingConnectionsView.reduce((previousValue, connectionView) => {
                        let connection: UserConnectionInstance = connectionView.userConnection!;
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
                                isMutual: connectionView.isMutual,
                                connectionTypes: {...connectionTypes, ...userConnectionTypes}
                            }
                        }
                    }, {});
                }
            }
        }
        catch (err) {
            console.error(`Error looking up connections for uniqueId ${uniqueId}:\n${err.message}`);
        }

        return {};
    }

    async getIncomingConnections(uniqueId: string, specificConnectionId?: string): Promise<WebsiteBoilerplate.UserConnectionDetails> {
        try {
            let s_registeredUserId: number | undefined = await this.getUserIdForUniqueId(uniqueId);

            if (s_registeredUserId !== undefined) {
                let incomingConnectionsView: UserConnectionViewInstance[] | null = await db.Views.UserConnectionView.findAll({
                    where: {
                        connectedUserId: s_registeredUserId
                    },
                    attributes: [
                        'isMutual'
                    ],
                    include: [
                        {
                            model: db.UserConnection,
                            as: 'userConnection',
                            required: true,
                            include: [
                                {
                                    model: db.User,
                                    as: 'requestedUser',
                                    attributes: [
                                        'uniqueId'
                                    ],
                                    required: true,
                                    include: [
                                        {
                                            model: db.DisplayName,
                                            as: 'displayNames',
                                            where: {
                                                isActive: 1
                                            },
                                            attributes: [
                                                'displayName',
                                                'displayNameIndex'
                                            ],
                                            required: false
                                        },
                                        {
                                            model: db.ProfilePicture,
                                            as: 'profilePictures',
                                            attributes: [
                                                'smallFileName'
                                            ],
                                            order: [['id', 'DESC']],
                                            required: false
                                        }
                                    ]
                                },
                                {
                                    model: db.UserConnectionType,
                                    as: 'connectionTypes',
                                    required: false,
                                    attributes: [
                                        'displayName'
                                    ],
                                    through: {
                                        attributes: []
                                    }
                                }
                            ]
                        }
                    ]
                });

                if (incomingConnectionsView && incomingConnectionsView.length > 0) {
                    return incomingConnectionsView.reduce((previousValue, connectionView) => {
                        let connection: UserConnectionInstance = connectionView.userConnection!;
                        let requestedUser: UserInstance = connection.requestedUser!;
    
                        return {
                            ...previousValue,
                            [requestedUser.uniqueId]: {
                                displayName: (requestedUser.displayNames && requestedUser.displayNames[0] ? requestedUser.displayNames[0].displayName : ''),
                                displayNameIndex: (requestedUser.displayNames && requestedUser.displayNames[0] ? requestedUser.displayNames[0].displayNameIndex : -1),
                                pfpSmall: (requestedUser.profilePictures && requestedUser.profilePictures[0] ? `i/u/${uniqueId}/${requestedUser.profilePictures[0].smallFileName}` : 'i/s/pfpDefault.svgz'),
                                isMutual: connectionView.isMutual,
                                connectionTypes: {}
                            }
                        }
                    }, {});
                }
            }
        }
        catch (err) {
            console.error(`Error looking up connections for uniqueId ${uniqueId}:\n${err.message}`);
        }

        return {};
    }

    async getConnectionTypeDict(): Promise<WebsiteBoilerplate.UserConnectionTypeDictionary> {
        //##TODO: Cache Results .cache(Constants.CONNECTION_TYPES_CACHE_HOURS * 60 * 60 * 1000)
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

        return {};
    }

    async gets_ConnectionTypes(): Promise<UserConnectionTypeInstance[]> {
        //##TODO: Cache Results .cache(Constants.CONNECTION_TYPES_CACHE_HOURS * 60 * 60 * 1000)
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

        return false;
    }
};

export let databaseHelper: DatabaseHelper = new DatabaseHelper();