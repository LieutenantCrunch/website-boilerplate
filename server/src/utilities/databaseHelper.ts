import fs from 'fs';
import memoize from 'memoizee';
import bcrypt from 'bcryptjs';
import NodeCache from 'node-cache';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import * as ClientConstants from '../constants/constants.client';
import * as ServerConstants from '../constants/constants.server';
import { adjustGUIDDashes, isNullOrWhiteSpaceOnly } from './utilityFunctions';
import { SocketHelper } from './socketHelper';

import { db } from '../models/_index';
import { UserInstance } from '../models/User';
import { ProfilePictureInstance } from '../models/ProfilePicture';
import { UserJWTInstance } from '../models/UserJWT';
import { DisplayNameInstance } from '../models/DisplayName';
import { UserConnectionInstance } from '../models/UserConnection';
import { UserConnectionTypeInstance } from '../models/UserConnectionType';
import { PasswordResetTokenInstance } from '../models/PasswordResetToken';
import { UserBlockInstance } from '../models/UserBlock';

import { FeedViewInstance } from '../models/views/FeedView';
import { UserConnectionViewInstance } from '../models/views/UserConnectionView';
import { PostInstance } from '../models/Post';
import { PostFileInstance } from '../models/PostFile';
import { PostCommentInstance } from '../models/PostComment';
import { notificationHelper } from './notificationHelper';
import { PostNotificationInstance } from '../models/PostNotification';

class DatabaseHelper {
    private static instance: DatabaseHelper;
    private nodeCache: NodeCache = new NodeCache();

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
            let registeredUser: UserInstance | null = await db.User.findOne({
                attributes: [
                    'id'
                ],
                where: {
                    email
                }
            });

            if (registeredUser) {
                return true;
            }
        }
        catch (err)
        {
            console.error(`Could not find any users for email ${email}: ${err.message}`);
        }
        
        return false;
    }

    async userExistsForProfileName(currentUserUniqueId: string | undefined, profileName: string): Promise<{exists: Boolean, allowPublicAccess: Boolean}> {
        try
        {
            let registeredUser: UserInstance | null = await this.getUserWithProfileName(profileName);

            if (registeredUser) {
                let exists: Boolean = true;

                if (currentUserUniqueId) {
                    exists = !(await this.checkIfFirstUserIsBlockingSecond(registeredUser.id!, currentUserUniqueId));
                }

                return {exists, allowPublicAccess: registeredUser.allowPublicAccess!};
            }
        }
        catch (err)
        {
            console.error(`Error looking up user with profile name ${profileName}:\n${err.message}`);
        }

        return {exists: false, allowPublicAccess: false};
    }

    async _checkIfFirstUserIsBlockingSecond(firstId: string | number, secondId: string | number): Promise<Boolean> {
        let actualFirstId: number | undefined = undefined;
        let actualSecondId: number | undefined = undefined;

        if (typeof secondId === 'string') {
            actualSecondId = await this.getUserIdForUniqueId(secondId);
        }
        else {
            actualSecondId = secondId;
        }

        if (await this.checkUserForRole(actualSecondId, 'Administrator')) {
            return false;
        }
        
        if (typeof firstId === 'string') {
            actualFirstId = await this.getUserIdForUniqueId(firstId);
        }
        else {
            actualFirstId = firstId;
        }

        if (actualFirstId !== undefined && actualSecondId !== undefined) {
            let results: UserBlockInstance | null = await db.UserBlock.findOne({
                where: {
                    registeredUserId: actualFirstId,
                    blockedUserId: actualSecondId
                }
            });

            if (results) {
                return true;
            }
        }

        return false;
    }

    checkIfFirstUserIsBlockingSecond = memoize(this._checkIfFirstUserIsBlockingSecond, {
        promise: true
    });

    async getProfileInfo(currentUniqueId: string | undefined, profileName: string, includeEmail: Boolean): Promise<WebsiteBoilerplate.UserDetails | null> {
        try {
            let currentUserId: number | undefined = await this.getUserIdForUniqueId(currentUniqueId || '-1');
            let isPublicUser: Boolean = currentUserId === undefined;
            let connectionTypes: WebsiteBoilerplate.UserConnectionTypeDictionary = {};

            let queryOptions: {[key: string]: any;} = {
                where: {
                    profileName: profileName.toLowerCase()
                },
                attributes: [
                    'id',
                    'allowPublicAccess',
                    'uniqueId'
                ],
                include: [
                    {
                        model: db.DisplayName,
                        as: 'displayNames',
                        where: {
                            isActive: true
                        },
                        attributes: [
                            'displayName',
                            'displayNameIndex'
                        ]
                    },
                    {
                        model: db.ProfilePicture,
                        as: 'profilePictures',
                        required: false,
                        on: {
                            id: {
                                [Op.eq]: Sequelize.literal('(select `id` FROM `profile_picture` where `profile_picture`.`registered_user_id` = `User`.`id` order by `profile_picture`.`id` desc limit 1)')
                            }
                        },
                        attributes: [
                            'fileName',
                            'smallFileName'
                        ]
                    }
                ]
            };

            if (isPublicUser) {
                // If there is no current user, we need to make sure the user we're looking up allows public access
                queryOptions.where = {
                    ...queryOptions.where,
                    allowPublicAccess: true
                };
            }
            else {
                // If they are logged in, pull any connection info
                connectionTypes = await this.getConnectionTypeDict();
                
                queryOptions.include.push({
                    model: db.UserConnection,
                    as: 'incomingConnections',
                    required: false,
                    where: {
                        requestedUserId: currentUserId
                    },
                    include: [
                        {
                            model: db.UserConnectionType,
                            as: 'connectionTypes',
                            required: false
                        }
                    ]
                },
                {
                    model: db.User,
                    as: 'blockingUsers',
                    required: false,
                    attributes: [
                        'id'
                    ],
                    where: {
                        id: currentUserId
                    }
                });
            }

            let registeredUser: UserInstance | null = await db.User.findOne(queryOptions);

            if (registeredUser) {
                let isMutual: Boolean = false;

                let displayNames: DisplayNameInstance[] | undefined = registeredUser.displayNames;
                let displayName: DisplayNameInstance | null = displayNames && displayNames.length > 0 ? displayNames[0] : null;

                let profilePictures: ProfilePictureInstance[] | undefined = registeredUser.profilePictures;
                let profilePicture: ProfilePictureInstance | null = profilePictures && profilePictures.length > 0 ? profilePictures[0] : null;

                if (isPublicUser) {
                    return {
                        allowPublicAccess: true,
                        displayName: displayName ? displayName.displayName : '',
                        displayNameIndex: displayName ? displayName.displayNameIndex : -1,
                        isBlocked: false, /* This is a public user so they won't have been blocked */
                        isMutual,
                        pfp: profilePicture ? `/i/u/${registeredUser.uniqueId}/${profilePicture.fileName}` : '/i/s/pfpDefault.svgz',
                        pfpSmall: profilePicture ? `/i/u/${registeredUser.uniqueId}/${profilePicture.smallFileName}` : '/i/s/pfpDefault.svgz',
                        profileName,
                        uniqueId: registeredUser.uniqueId
                    };
                }
                else {
                    if (await this.checkIfFirstUserIsBlockingSecond(registeredUser.id!, currentUserId!)) {
                        return null;
                    }

                    let connectionViewRecord: UserConnectionViewInstance | null = await db.Views.UserConnectionView.findOne({
                        where: {
                            requestedUserId: currentUserId,
                            connectedUserId: registeredUser.id!
                        }
                    });

                    isMutual = connectionViewRecord && connectionViewRecord.isMutual || false;

                    let userConnectionTypes: WebsiteBoilerplate.UserConnectionTypeDictionary = {};
                    let blockingUsers: UserInstance[] | undefined = registeredUser.blockingUsers;
                    let isBlocked: Boolean = blockingUsers !== undefined && blockingUsers.length > 0;
                        
                    if (registeredUser.incomingConnections && registeredUser.incomingConnections[0] && registeredUser.incomingConnections[0].connectionTypes) {
                        let incomingTypes: UserConnectionTypeInstance[] = registeredUser.incomingConnections[0].connectionTypes!;
                        userConnectionTypes = incomingTypes.reduce((previousValue, connectionType) => ({
                            ...previousValue,
                            [connectionType.displayName]: true
                        }), {});
                    }

                    return {
                        allowPublicAccess: registeredUser.allowPublicAccess,
                        connectedToCurrentUser: (registeredUser.incomingConnections !== undefined && registeredUser.incomingConnections.length > 0),
                        connectionTypes: {
                            ...connectionTypes,
                            ...userConnectionTypes
                        },
                        displayName: displayName ? displayName.displayName : '',
                        displayNameIndex: displayName ? displayName.displayNameIndex : -1,
                        isBlocked,
                        isMutual,
                        pfp: profilePicture ? `/i/u/${registeredUser.uniqueId}/${profilePicture.fileName}` : '/i/s/pfpDefault.svgz',
                        pfpSmall: profilePicture ? `/i/u/${registeredUser.uniqueId}/${profilePicture.smallFileName}` : '/i/s/pfpDefault.svgz',
                        profileName,
                        uniqueId: registeredUser.uniqueId
                    };
                }
            }
        }
        catch (err) {
            console.error(`Error looking up user with profile name ${profileName}: ${err.message}`);
        }

        return null;
    }

    async _getUserIdForUniqueId(uniqueId: string): Promise<number | undefined> {
        try
        {
            let registeredUser: UserInstance | null = await db.User.findOne({
                where: {
                    uniqueId
                },
                attributes: [
                    'id'
                ]
            });

            if (registeredUser) {
                return registeredUser.id;
            }
        }
        catch (err)
        {
            console.error(`Error looking up user with unique id ${uniqueId}: ${err.message}`);
        }

        return undefined;
    }

    getUserIdForUniqueId = memoize(this._getUserIdForUniqueId, {
        maxAge: ServerConstants.CACHE_DURATIONS.USER_BY_UNIQUE_ID,
        promise: true
    });

    async _getUniqueIdForUserId(id: number): Promise<string | undefined> {
        try
        {
            let registeredUser: UserInstance | null = await db.User.findOne({
                where: {
                    id
                },
                attributes: [
                    'uniqueId'
                ]
            });

            if (registeredUser) {
                return registeredUser.uniqueId;
            }
        }
        catch (err)
        {
            console.error(`Error looking up user with id ${id}: ${err.message}`);
        }

        return undefined;
    }

    getUniqueIdForUserId = memoize(this._getUniqueIdForUserId, {
        maxAge: ServerConstants.CACHE_DURATIONS.USER_BY_ID,
        promise: true
    });

    async _getUserWithId(id: number): Promise<UserInstance | null> {
        try
        {
            let registeredUser: UserInstance | null = await db.User.findOne({
                where: {
                    id
                },
                include: [
                    {
                        model: db.DisplayName,
                        as: 'displayNames',
                        where: {
                            isActive: true
                        },
                        attributes: [
                            'displayName',
                            'displayNameIndex'
                        ]
                    },
                    {
                        model: db.ProfilePicture,
                        as: 'profilePictures',
                        required: false,
                        on: {
                            id: {
                                [Op.eq]: Sequelize.literal('(select `id` FROM `profile_picture` where `profile_picture`.`registered_user_id` = `User`.`id` order by `profile_picture`.`id` desc limit 1)')
                            }
                        },
                        attributes: [
                            'fileName',
                            'smallFileName'
                        ]
                    }
                ]
            });

            return registeredUser;
        }
        catch (err)
        {
            console.error(`Error looking up user with id ${id}: ${err.message}`);
        }
        
        return null;
    }

    getUserWithId = memoize(this._getUserWithId, {
        maxAge: ServerConstants.CACHE_DURATIONS.USER_BY_ID,
        promise: true
    });

    async _getUserWithUniqueId(uniqueId: string): Promise<UserInstance | null> {
        try
        {
            let registeredUser: UserInstance | null = await db.User.findOne({
                where: {
                    uniqueId
                },
                include: [
                    {
                        model: db.DisplayName,
                        as: 'displayNames',
                        where: {
                            isActive: true
                        },
                        attributes: [
                            'displayName',
                            'displayNameIndex'
                        ]
                    },
                    {
                        model: db.ProfilePicture,
                        as: 'profilePictures',
                        required: false,
                        on: {
                            id: {
                                [Op.eq]: Sequelize.literal('(select `id` FROM `profile_picture` where `profile_picture`.`registered_user_id` = `User`.`id` order by `profile_picture`.`id` desc limit 1)')
                            }
                        },
                        attributes: [
                            'fileName',
                            'smallFileName'
                        ]
                    }
                ]
            });

            return registeredUser;
        }
        catch (err)
        {
            console.error(`Error looking up user with uniqueId ${uniqueId}: ${err.message}`);
        }
        
        return null;
    }

    getUserWithUniqueId = memoize(this._getUserWithUniqueId, {
        maxAge: ServerConstants.CACHE_DURATIONS.USER_BY_UNIQUE_ID,
        promise: true
    });

    async _getUserWithProfileName(profileName: string): Promise<UserInstance | null> {
        try
        {
            let registeredUser: UserInstance | null = await db.User.findOne({
                where: {
                    profileName
                },
                include: [
                    {
                        model: db.DisplayName,
                        as: 'displayNames',
                        where: {
                            isActive: true
                        },
                        attributes: [
                            'displayName',
                            'displayNameIndex'
                        ]
                    },
                    {
                        model: db.ProfilePicture,
                        as: 'profilePictures',
                        required: false,
                        on: {
                            id: {
                                [Op.eq]: Sequelize.literal('(select `id` FROM `profile_picture` where `profile_picture`.`registered_user_id` = `User`.`id` order by `profile_picture`.`id` desc limit 1)')
                            }
                        },
                        attributes: [
                            'fileName',
                            'smallFileName'
                        ]
                    }
                ]
            });

            return registeredUser;
        }
        catch (err)
        {
            console.error(`Error looking up user with profileName ${profileName}: ${err.message}`);
        }
        
        return null;
    }

    getUserWithProfileName = memoize(this._getUserWithProfileName, {
        maxAge: ServerConstants.CACHE_DURATIONS.USER_BY_PROFILE_NAME,
        promise: true
    });

    async registerNewUser(email: string, displayName: string, profileName: string, password: string): Promise<{id: string | null, success: Boolean}> {
        try
        {
            if (!displayName || displayName.length > 100 || displayName.indexOf('#') > -1) {
                return {id: null, success: false};
            }
            else if (!profileName || profileName.length > 20 || !ClientConstants.PROFILE_NAME_REGEX.test(profileName)) {
                return {id: null, success: false};
            }

            let salt: string = await bcrypt.genSalt(10);
            let passwordHash: string = await bcrypt.hash(password, salt);
            let uniqueId: string = uuidv4();

            let registeredUser: UserInstance | null = await db.User.create({
                email,
                passwordHash,
                uniqueId,
                profileName: profileName.toLowerCase()
            });

            if (registeredUser) {
                let results: {success: Boolean, displayNameIndex?: number, message?: string} = await this.setUserDisplayName(uniqueId, displayName);

                return {id: uniqueId, success: results.success};
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
            let registeredUser: UserInstance | null = await db.User.findOne({
                where: {
                    email
                }
            });

            if (registeredUser) {
                registeredUser.passwordHash = hash;
                await registeredUser.save();

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
            let registeredUser: UserInstance | null = await db.User.findOne({
                where: {
                    email
                }
            });

            if (registeredUser) {
                let passwordHash: string = registeredUser.passwordHash;
                let isValid = await bcrypt.compare(password, passwordHash);

                return {id: registeredUser.uniqueId, success: isValid};
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
            let registeredUser: UserInstance | null = await db.User.findOne({
                attributes: [
                    'id'
                ],
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

            if (registeredUser) {
                if (registeredUser.passwordResetTokens && registeredUser.passwordResetTokens.length < ServerConstants.RPT_MAX_ACTIVE_TOKENS) {
                    token = uuidv4();

                    let expirationDate: Date = new Date(Date.now()).addMinutes(ServerConstants.RPT_EXPIRATION_MINUTES);

                    let newResetToken: PasswordResetTokenInstance = await registeredUser.createPasswordResetToken({
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
            let resetToken: PasswordResetTokenInstance | null = await db.PasswordResetToken.findOne({
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

            if (resetToken) {
                return true;
            }
        }
        catch (err)
        {
            console.error(err.message);
        }

        return false;
    }

    async addProfilePictureToUser(fileName: string, smallFileName: string, originalFileName: string, mimeType: string, userUniqueId: string): Promise<{success: Boolean, pfp?: string, pfpSmall?: string}> {
        try
        {
            let registeredUser: UserInstance | null = await this.getUserWithUniqueId(userUniqueId);
            
            if (registeredUser) {
                let newPFP: ProfilePictureInstance | null = await registeredUser.createProfilePicture({
                    fileName,
                    originalFileName,
                    mimeType,
                    smallFileName
                });

                if (newPFP) {
                    return {
                        success: true, 
                        pfp: `/i/u/${userUniqueId}/${fileName}`,
                        pfpSmall: `/i/u/${userUniqueId}/${smallFileName}`
                    };
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
            let registeredUser: UserInstance | null = await db.User.findOne({
                attributes: [
                    'id'
                ],
                where: {
                    uniqueId
                }
            });

            if (registeredUser) {
                let registeredUserPfps: ProfilePictureInstance[] = await registeredUser.getProfilePictures({
                    order: [['id', 'DESC']]
                });

                if (registeredUserPfps.length > 0) {
                    let registeredUserPfp: ProfilePictureInstance = registeredUserPfps[0];

                    return originalSize ? registeredUserPfp.fileName : registeredUserPfp.smallFileName;
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
            let registeredUser: UserInstance | null = await this.getUserWithUniqueId(uniqueId);
            
            if (registeredUser) {
                let newJWT: UserJWTInstance | null = await registeredUser.createActiveJWT({
                    ...jwtInfo,
                    isValid: true
                });

                if (newJWT) {
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
            let registeredUser: UserInstance | null = await db.User.findOne({
                attributes: [
                    'id'
                ],
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
            
            if (registeredUser && registeredUser.activeJWTs) {
                let activeJWT: UserJWTInstance = registeredUser.activeJWTs[0];
                
                activeJWT.expirationDate = jwtInfo.expirationDate;
                activeJWT.save();

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
            let registeredUser: UserInstance | null = await db.User.findOne({
                attributes: [
                    'id'
                ],
                where: {
                    uniqueId
                }
            });

            if (registeredUser) {
                let activeJWTs: UserJWTInstance[] = await registeredUser.getActiveJWTs({
                    where: {
                        jti,
                        isValid: 1,
                        expirationDate: {
                            [Op.gt]: (new Date())
                        }
                    }
                });

                if (activeJWTs.length > 0) {
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

    async invalidateJWTsForUser(uniqueId: string, mode: number = ServerConstants.INVALIDATE_TOKEN_MODE.SPECIFIC, jti?: string): Promise<{success: Boolean}> {
        try
        {
            if (!jti) { // If we don't have an ID, then we have to expire all of them
                mode = ServerConstants.INVALIDATE_TOKEN_MODE.ALL;
            }

            let additionalQueryOptions: {[key: string]: any;} = {};
            
            switch (mode) {
                case ServerConstants.INVALIDATE_TOKEN_MODE.ALL:
                    break;
                case ServerConstants.INVALIDATE_TOKEN_MODE.OTHERS:
                    additionalQueryOptions = {
                        jti: {
                            [Op.ne]: jti
                        }
                    };
                    break;
                case ServerConstants.INVALIDATE_TOKEN_MODE.SPECIFIC:
                default:
                    additionalQueryOptions = {
                        jti
                    };    
                    break;
            }

            let registeredUser: UserInstance | null = await db.User.findOne({
                attributes: [
                    'id'
                ],
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

            if (registeredUser && registeredUser.activeJWTs) {
                let activeJWTs: UserJWTInstance[] = registeredUser.activeJWTs;
                let idArray: number[] = activeJWTs.map(activeJWT => activeJWT.id!);

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

                await registeredUser!.removeActiveJWTs(activeJWTs);
                await registeredUser!.addInactiveJWTs(activeJWTs);

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
            let registeredUser: UserInstance | null = await db.User.findOne({
                attributes: [
                    'email'
                ],
                where: {
                    uniqueId
                }
            });

            if (registeredUser) {
                return registeredUser.email;
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
            let registeredUser: UserInstance | null = await this.getUserWithUniqueId(uniqueId);

            if (registeredUser) {
                registeredUser.email = email;
                await registeredUser.save();

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
            let registeredUser: UserInstance | null = await this.getUserWithUniqueId(uniqueId);

            if (registeredUser) {
                let displayNames: DisplayNameInstance[] = await registeredUser.getDisplayNames({
                    attributes: [
                        'displayName'
                    ],
                    where: {
                        isActive: true
                    }
                });

                if (displayNames.length > 0) {
                    return displayNames[0].displayName;
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
            let registeredUser: UserInstance | null = await this.getUserWithUniqueId(uniqueId);

            if (!registeredUser) {
                return {success: false, message: `No user found for when trying to change the display name`};
            }

            if (displayName.indexOf('#') > -1) {
                return {success: false, message: `Display name does not meet requirements.`};
            }

            let displayNames: DisplayNameInstance[] = await registeredUser.getDisplayNames({
                order: [['activationDate', 'DESC']]
            });

            let currentDate: Date = new Date(Date.now());

            // If they have existing display names
            if (displayNames.length > 0) {
                let currentDisplayName: DisplayNameInstance | undefined = displayNames.find(entry => entry.isActive);
                let matchingDisplayName: DisplayNameInstance | undefined = displayNames.find(entry => entry.displayName === displayName);
                let mostRecentChange: Date = displayNames[0].activationDate;

                // Check if they haven't changed their name in at least the configured amount of days

                if ((currentDate.getTime() - mostRecentChange.getTime())/(1000 * 60 * 60 * 24) <= ClientConstants.DISPLAY_NAME_CHANGE_DAYS) {
                    let nextAvailableChange: Date = new Date(mostRecentChange.getTime() + (1000 * 60 * 60 * 24 * ClientConstants.DISPLAY_NAME_CHANGE_DAYS));
                    // Fail with message
                    return {success: false, message: `It hasn't been ${ClientConstants.DISPLAY_NAME_CHANGE_DAYS} day${ClientConstants.DISPLAY_NAME_CHANGE_DAYS === 1 ? '' : 's'} since the last time you changed your display name. You can change your display name again on ${nextAvailableChange.toLocaleString()}.`};
                }

                if (currentDisplayName) {
                    if (currentDisplayName === matchingDisplayName) {
                        // No need to make any changes, they already have the specified display name, return without doing anything else
                        return {success: true, displayNameIndex: matchingDisplayName.displayNameIndex, message: 'Your display name has been changed successfully.'};
                    }
                    else {
                        // Deactivate the current display name
                        currentDisplayName.isActive = false;
                        currentDisplayName.save();
                    }
                }

                if (matchingDisplayName) {
                    // Reactivate the former display name and return without creating a new display name
                    matchingDisplayName.isActive = true;
                    matchingDisplayName.activationDate = currentDate;
                    matchingDisplayName.save();

                    return {success: true, displayNameIndex: matchingDisplayName.displayNameIndex, message: 'Your display name has been changed successfully.'};
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
                registeredUserId: registeredUser.id!,
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
            let verifiedDisplayName: DisplayNameInstance | null = await db.DisplayName.findOne({
                where: {
                    displayName,
                    displayNameIndex: 0
                }
            });
           
            if (verifiedDisplayName) {
                return {success: false, message: 'That display name has already been verified.'};
            }
            else {
                verifiedDisplayName = await db.DisplayName.findOne({
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
                
                if (verifiedDisplayName) {
                    verifiedDisplayName.displayNameIndex = 0;

                    verifiedDisplayName.save();

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
            let currentUser: UserInstance | null = null;
            
            if (currentUniqueId) {
                if (await this.checkIfFirstUserIsBlockingSecond(uniqueId, currentUniqueId)) {
                    return null;
                }

                currentUser = await this.getUserWithUniqueId(currentUniqueId);
            }

            let registeredUser: UserInstance | null = await db.User.findOne({
                where: {
                    uniqueId
                },
                attributes: [
                    'id', /* This is necessary to select so the lazy loading of incomingConnections below will work */
                    'allowPublicAccess',
                    'email',
                    'uniqueId',
                    'profileName'
                ],
                include: [
                    {
                        model: db.DisplayName,
                        as: 'displayNames',
                        attributes: [
                            'displayName',
                            'displayNameIndex'
                        ]
                    }, 
                    {
                        model: db.ProfilePicture,
                        as: 'profilePictures',
                        attributes: [
                            'fileName',
                            'smallFileName'
                        ]
                    },
                    {
                        model: db.Role,
                        as: 'roles',
                        attributes: [
                            'roleName'
                        ]
                    }
                ]
            });
  
            if (registeredUser) {
                let isMutual: Boolean = false;

                if (currentUser) {
                    let connectionViewRecord: UserConnectionViewInstance | null = await db.Views.UserConnectionView.findOne({
                        attributes: [
                            'id'
                        ],
                        where: {
                            requestedUserId: currentUser.id!,
                            connectedUserId: registeredUser.id!
                        }
                    });

                    isMutual = connectionViewRecord && connectionViewRecord.isMutual || false;
                }

                let userDetails: WebsiteBoilerplate.UserDetails = {
                    allowPublicAccess: registeredUser.allowPublicAccess,
                    displayName: (registeredUser.displayNames && registeredUser.displayNames[0] ? registeredUser.displayNames[0].displayName : ''),
                    displayNameIndex: (registeredUser.displayNames && registeredUser.displayNames[0] ? registeredUser.displayNames[0].displayNameIndex : -1),
                    isBlocked: false, /* Handled below */
                    isMutual,
                    pfp: (registeredUser.profilePictures && registeredUser.profilePictures[0] ? `/i/u/${uniqueId}/${registeredUser.profilePictures[0].fileName}` : '/i/s/pfpDefault.svgz'),
                    pfpSmall: (registeredUser.profilePictures && registeredUser.profilePictures[0] ? `/i/u/${uniqueId}/${registeredUser.profilePictures[0].smallFileName}` : '/i/s/pfpDefault.svgz'),
                    profileName: registeredUser.profileName,
                    roles: (registeredUser.roles ? registeredUser.roles.map(role => role.roleName) : []),
                    uniqueId
                };

                let unseenPostNotifications: PostNotificationInstance[] = await db.PostNotification.findAll({
                    attributes: [
                        'postId',
                        'notificationType'
                    ],
                    where: {
                        registeredUserId: registeredUser.id!,
                        notificationStatus: ClientConstants.NOTIFICATION_STATUS.UNSEEN
                    },
                    group: [
                        'postId',
                        'notificationType'
                    ]
                });

                userDetails.unseenPostNotifications = unseenPostNotifications.length;

                if (includeEmail) {
                    userDetails.email = registeredUser.email;
                }

                if (getConnectionTypes) {
                    if (currentUser) {
                        let incomingConnections: UserConnectionInstance[] = await registeredUser.getIncomingConnections({
                            where: {
                                requestedUserId: currentUser.id!
                            },
                            include: {
                                model: db.UserConnectionType,
                                as: 'connectionTypes'
                            }
                        });

                        let allConnectionTypes: WebsiteBoilerplate.UserConnectionTypeDictionary = await this.getConnectionTypeDict();

                        if (incomingConnections.length > 0) {
                            let connectionTypes: WebsiteBoilerplate.UserConnectionTypeDictionary;

                            if (incomingConnections[0].connectionTypes) {
                                connectionTypes = incomingConnections[0].connectionTypes.reduce((previousValue, connectionType) => ({
                                    ...previousValue,
                                    [connectionType.displayName]: true
                                }), {});
                            }
                            else {
                                connectionTypes = allConnectionTypes;
                            }

                            userDetails.connectedToCurrentUser = true;
                            userDetails.connectionTypes = connectionTypes;
                            
                        }
                        else {
                            userDetails.connectedToCurrentUser = false;
                            userDetails.connectionTypes = allConnectionTypes;
                        }

                        let blockedUsers: UserInstance[] = await currentUser.getBlockedUsers({
                            attributes: [
                                'id'
                            ],
                            where: {
                                id: registeredUser.id!
                            }
                        });

                        userDetails.isBlocked = blockedUsers.length > 0;
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

    async _checkUserForRole(uniqueId: string | number | undefined, roleName: string): Promise<Boolean> {
        try
        {
            if (uniqueId) {
                let id: number | undefined = undefined;

                if (typeof uniqueId === 'string') {
                    id = await this.getUserIdForUniqueId(uniqueId);
                }
                else {
                    id = uniqueId;
                }

                if (id) {
                    let registeredUser: UserInstance | null = await db.User.findOne({
                        attributes: [
                            'id'
                        ],
                        where: {
                            id
                        },
                        include: {
                            model: db.Role,
                            as: 'roles',
                            required: true,
                            attributes: [
                                'id'
                            ],
                            where: {
                                roleName
                            }
                        }
                    });

                    if (registeredUser) {
                        return true;
                    }
                }
            }
        }
        catch (err) {
            console.error(`Error checking role (${roleName}) for user ${uniqueId}:\n${err.message}`);
        }

        return false;
    }

    // ##TODO: Will need to invalidate this once the ability to add and remove roles is implemented
    checkUserForRole = memoize(this._checkUserForRole, {
        promise: true
    });

    async searchUsers(currentUserUniqueId: string, displayNameFilter: string, displayNameIndexFilter: number, pageNumber: number, excludeConnections: Boolean): Promise<WebsiteBoilerplate.UserSearchResults | null> {
        try {
            let currentUser: UserInstance | null = await this.getUserWithUniqueId(currentUserUniqueId);

            if (currentUser) {
                let currentUserId: number = currentUser.id!;

                let isAdministrator: Boolean = await this.checkUserForRole(currentUserUniqueId, 'Administrator');

                let blockingUsers: UserInstance[] = await currentUser.getBlockingUsers({
                    attributes: [
                        'id'
                    ]
                });

                let blockingIds: number[] = blockingUsers.map(user => user.id!);

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
                            attributes: [
                                'uniqueId',
                                'profileName'
                            ],
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
                                        'smallFileName',
                                        'fileName'
                                    ]
                                },
                                {
                                    model: db.User,
                                    as: 'blockingUsers',
                                    required: false,
                                    attributes: [
                                        'id'
                                    ],
                                    where: {
                                        id: currentUserId
                                    }
                                }
                            ]
                        }
                    ],
                    order: [
                        ['displayName', 'ASC'], 
                        ['displayNameIndex', 'ASC']
                    ],
                    offset: pageNumber * ServerConstants.DB_USER_FETCH_PAGE_SIZE,
                    limit: ServerConstants.DB_USER_FETCH_PAGE_SIZE,
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
                            Sequelize.where(Sequelize.cast(Sequelize.col('DisplayName.display_name_index'), 'char'), {
                                [Op.like]: `${displayNameIndexFilter}%`
                            })
                        ]
                    };
                }

                if (!isAdministrator && blockingIds.length > 0) {
                    queryOptions.where = {
                        ...queryOptions.where,
                        '$registeredUser.id$': {
                            [Op.notIn]: blockingIds
                        }
                    }
                }

                let connectionViewRecords: UserConnectionViewInstance[] | null = null;

                // This will get all of the incoming connections to the current user
                connectionViewRecords = await db.Views.UserConnectionView.findAll({
                    where: {
                        connectedUserId: currentUserId,
                        isMutual: true
                    }
                });

                if (excludeConnections) {
                    let excludedOutgoingConnections: number[] | null = null;

                    // Go through the list and put all of the ids into a new array
                    if (connectionViewRecords && connectionViewRecords.length > 0) {
                        excludedOutgoingConnections = connectionViewRecords.map((record) => (record.id));
                    }

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
                            [Op.ne]: currentUserUniqueId
                        },
                        '$registeredUser.incomingConnections.requestedUser.unique_id$': {
                            [Op.or]: {
                                [Op.is]: null,
                                [Op.ne]: currentUserUniqueId
                            }
                        }
                    };

                    // Any users who don't have any outgoing connections or who aren't already a mutual connection are fine to return
                    if (excludedOutgoingConnections) {
                        queryOptions.where = {
                            ...queryOptions.where,
                            '$registeredUser.outgoingConnections.id$': {
                                [Op.or]: {
                                    [Op.is]: null,
                                    [Op.notIn]: excludedOutgoingConnections
                                }
                            }
                        };
                    }
                    else {
                        queryOptions.where = {
                            ...queryOptions.where,
                            '$registeredUser.outgoingConnections.id$': {
                                [Op.is]: null
                            }
                        };
                    }
                }

                let {rows, count}: {rows: DisplayNameInstance[]; count: number} = await db.DisplayName.findAndCountAll(queryOptions);

                let results: WebsiteBoilerplate.UserSearchResults = {
                    currentPage: pageNumber,
                    total: count,
                    users: rows.map(displayName => {
                        let isMutual: Boolean = false;
                        let isBlocked: Boolean = false;

                        // If excluding connections, none of them will be mutual
                        // If not excluding connections, some of them will be mutual
                        // In order for a connection to be mutual, an incoming connection must exist, and since connectionViewRecords contains all incoming connections, we can check their isMutual flag
                        if (!excludeConnections && connectionViewRecords) {
                            let connectionViewRecord: UserConnectionViewInstance | undefined = connectionViewRecords.find(record => record.requestedUserId === displayName.registeredUser!.id);

                            if (connectionViewRecord) {
                                isMutual = connectionViewRecord.isMutual;
                            }
                        }

                        if (displayName.registeredUser!.blockingUsers && displayName.registeredUser!.blockingUsers[0]) {
                            isBlocked = true;
                        }

                        return {
                            displayName: displayName.displayName, 
                            displayNameIndex: displayName.displayNameIndex, 
                            isBlocked,
                            isMutual,
                            pfp: (displayName.registeredUser!.profilePictures && displayName.registeredUser!.profilePictures[0] ? `/i/u/${displayName.registeredUser!.uniqueId}/${displayName.registeredUser!.profilePictures[0].fileName}` : '/i/s/pfpDefault.svgz'),
                            pfpSmall: (displayName.registeredUser!.profilePictures && displayName.registeredUser!.profilePictures[0] ? `/i/u/${displayName.registeredUser!.uniqueId}/${displayName.registeredUser!.profilePictures[0].smallFileName}` : '/i/s/pfpDefault.svgz'),
                            profileName: displayName.registeredUser!.profileName,
                            uniqueId: displayName.registeredUser!.uniqueId
                        };
                    })
                };

                return results;
            }
        }
        catch (err) {
            console.error(`An error occurred while looking up users, Display Name: ${displayNameFilter}, Index: ${displayNameIndexFilter}\n${err.message}`);
        }

        return null;        
    }

    async getOutgoingConnections(uniqueId: string, specificConnectionId?: string): Promise<WebsiteBoilerplate.UserDetails[]> {
        try {
            let connectionTypes: WebsiteBoilerplate.UserConnectionTypeDictionary = await this.getConnectionTypeDict();

            let registeredUserId: number | undefined = await this.getUserIdForUniqueId(uniqueId);

            if (registeredUserId !== undefined) {
                let isAdministrator: Boolean = await this.checkUserForRole(registeredUserId, 'Administrator');

                let queryOptions: {[key: string]: any;} = {};

                let userConnectionIncludes: {[key: string]: any;}[] = [
                    {
                        model: db.User,
                        as: 'connectedUser',
                        attributes: [
                            'allowPublicAccess',
                            'uniqueId',
                            'profileName'
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
                ];

                if (isAdministrator) {
                    queryOptions.where = {
                        requestedUserId: registeredUserId
                    };
                }
                else {
                    // Need to filter out users that are blocking the current user if the current user is not an administrator
                    // left join userBlock using the keys on userConnection and select the results where userBlock.registeredUserId is null
                    userConnectionIncludes.push({
                        model: db.UserBlock,
                        as: 'userBlock',
                        required: false
                    });

                    queryOptions.where = {
                        [Op.and]: [
                            { requestedUserId: registeredUserId },
                            { '$userConnection.userBlock.registered_user_id$': { [Op.is]: null } }
                        ]
                    };
                }

                queryOptions = {
                    ...queryOptions,
                    attributes: [
                        'isMutual'
                    ],
                    include: [
                        {
                            model: db.UserConnection,
                            as: 'userConnection',
                            required: true,
                            include: userConnectionIncludes
                        }
                    ]
                };

                let outgoingConnectionsView: UserConnectionViewInstance[] | null = await db.Views.UserConnectionView.findAll(queryOptions);

                if (outgoingConnectionsView && outgoingConnectionsView.length > 0) {
                    return outgoingConnectionsView.map(connectionView => {
                        let connection: UserConnectionInstance = connectionView.userConnection!;
                        
                        let connectedUser: UserInstance = connection.connectedUser!;
    
                        let userConnectionTypes: WebsiteBoilerplate.UserConnectionTypeDictionary = {};
                        
                        if (connection.connectionTypes) {
                            userConnectionTypes = connection.connectionTypes.reduce((previousValue, connectionType) => ({
                                ...previousValue,
                                [connectionType.displayName]: true
                            }), {});
                        }

                        return {
                            allowPublicAccess: connectedUser!.allowPublicAccess,
                            connectedToCurrentUser: true, /* Outgoing connections are always connected to the user */
                            connectionTypes: {...connectionTypes, ...userConnectionTypes},
                            displayName: (connectedUser!.displayNames && connectedUser!.displayNames[0] ? connectedUser!.displayNames[0].displayName : ''),
                            displayNameIndex: (connectedUser!.displayNames && connectedUser!.displayNames[0] ? connectedUser!.displayNames[0].displayNameIndex : -1),
                            isBlocked: false, /* Outgoing connections shouldn't be blocked */
                            isMutual: connectionView.isMutual,
                            pfp: (connectedUser!.profilePictures && connectedUser!.profilePictures[0] ? `/i/u/${uniqueId}/${connectedUser!.profilePictures[0].fileName}` : '/i/s/pfpDefault.svgz'),
                            pfpSmall: (connectedUser!.profilePictures && connectedUser!.profilePictures[0] ? `/i/u/${uniqueId}/${connectedUser!.profilePictures[0].smallFileName}` : '/i/s/pfpDefault.svgz'),
                            profileName: connectedUser!.profileName,
                            uniqueId: connectedUser!.uniqueId
                        };
                    });
                }
            }
        }
        catch (err) {
            console.error(`Error looking up connections for uniqueId ${uniqueId}:\n${err.message}`);
        }

        return [];
    }

    async getIncomingConnections(uniqueId: string, specificConnectionId?: string): Promise<WebsiteBoilerplate.UserDetails[]> {
        try {
            let connectionTypes: WebsiteBoilerplate.UserConnectionTypeDictionary = await this.getConnectionTypeDict();

            let registeredUserId: number | undefined = await this.getUserIdForUniqueId(uniqueId);

            if (registeredUserId !== undefined) {
                let incomingConnectionsView: UserConnectionViewInstance[] | null = await db.Views.UserConnectionView.findAll({
                    where: {
                        connectedUserId: registeredUserId
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
                                        'allowPublicAccess',
                                        'uniqueId',
                                        'profileName'
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
                                        },
                                        {
                                            model: db.User,
                                            as: 'blockingUsers',
                                            required: false,
                                            attributes: [
                                                'id'
                                            ],
                                            where: {
                                                id: registeredUserId
                                            }
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
                        },
                        {
                            model: db.UserConnection,
                            as: 'mutualConnection',
                            required: false,
                            include: [
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
                    return incomingConnectionsView.reduce((results: WebsiteBoilerplate.UserDetails[], connectionView: UserConnectionViewInstance) => {
                        if (!connectionView.isMutual) {                          
                            let connection: UserConnectionInstance = connectionView.userConnection!;
                            let requestedUser: UserInstance = connection.requestedUser!;

                            let isBlocked: Boolean = false;

                            if (requestedUser.blockingUsers && requestedUser.blockingUsers.length > 0) {
                                isBlocked = true;
                            }

                            results.push({
                                allowPublicAccess: requestedUser.allowPublicAccess,
                                connectedToCurrentUser: false, /* This list will only contain users who are not connected */
                                connectionTypes: {...connectionTypes},    
                                displayName: (requestedUser.displayNames && requestedUser.displayNames[0] ? requestedUser.displayNames[0].displayName : ''),
                                displayNameIndex: (requestedUser.displayNames && requestedUser.displayNames[0] ? requestedUser.displayNames[0].displayNameIndex : -1),
                                isBlocked,
                                isMutual: false, /* Incoming connections will never be mutual */
                                pfp: (requestedUser.profilePictures && requestedUser.profilePictures[0] ? `/i/u/${uniqueId}/${requestedUser.profilePictures[0].fileName}` : '/i/s/pfpDefault.svgz'),
                                pfpSmall: (requestedUser.profilePictures && requestedUser.profilePictures[0] ? `/i/u/${uniqueId}/${requestedUser.profilePictures[0].smallFileName}` : '/i/s/pfpDefault.svgz'),
                                profileName: requestedUser.profileName,
                                uniqueId: requestedUser.uniqueId
                            });
                        }

                        return results;
                    }, []);
                }
            }
        }
        catch (err) {
            console.error(`Error looking up connections for uniqueId ${uniqueId}:\n${err.message}`);
        }

        return [];
    }

    async getConnectionTypeDict(): Promise<WebsiteBoilerplate.UserConnectionTypeDictionary> {
        try {
            let connectionTypesDict: WebsiteBoilerplate.UserConnectionTypeDictionary | undefined = this.nodeCache.get(ServerConstants.CACHE_KEY_CONNECTION_TYPES_DICT);

            if (!connectionTypesDict) {
                let connectionTypes: UserConnectionTypeInstance[] = await this.getConnectionTypes();

                connectionTypesDict = connectionTypes.reduce((previousValue, currentValue) => {
                    return {
                        ...previousValue,
                        [currentValue.displayName]: false
                    }
                }, {});

                this.nodeCache.set(ServerConstants.CACHE_KEY_CONNECTION_TYPES_DICT, connectionTypesDict, ServerConstants.CACHE_DURATIONS.CONNECTION_TYPES);
            }

            return connectionTypesDict;
        }
        catch (err) {
            console.error(`Error looking up connection types:\n${err.message}`);
        }

        return {};
    }

    async getConnectionTypes(): Promise<UserConnectionTypeInstance[]> {
        try {
            let userConnectionTypes: UserConnectionTypeInstance[] | null = await db.UserConnectionType.findAll();

            if (userConnectionTypes)
            {
                return userConnectionTypes;
            }
        }
        catch (err) {
            console.error(`Error looking up connection types:\n${err.message}`);
        }

        return [];
    }

    async removeUserConnection(currentUserUniqueId: string, connectedUserUniqueId: string): Promise<WebsiteBoilerplate.RemoveUserConnectionResults> {
        try
        {
            let currentUser: UserInstance | null = await this.getUserWithUniqueId(currentUserUniqueId);
            let connectedUser: UserInstance | null = await this.getUserWithUniqueId(connectedUserUniqueId);

            if (currentUser && connectedUser) {
                let userConnection: UserConnectionInstance | null = await db.UserConnection.findOne({
                    where: {
                        requestedUserId: currentUser.id!,
                        connectedUserId: connectedUser.id!
                    }
                });
                
                let wasMutual: Boolean = false;

                if (userConnection) {
                    let userConnectionView: UserConnectionViewInstance | null = await db.Views.UserConnectionView.findOne({
                        where: {
                            id: userConnection.id!
                        }
                    });

                    if (userConnectionView) {
                        wasMutual = userConnectionView.isMutual;
                    }

                    await userConnection.destroy();
                }
                
                return {success: true, wasMutual};
            }
        }
        catch (err) {
            console.error(`Error removing connection:\n${err.message}`);
        }

        return {success: false, wasMutual: false};
    }

    async updateUserConnection(currentUserUniqueId: string, connectionUpdates: WebsiteBoilerplate.UserDetails): Promise<WebsiteBoilerplate.UpdateUserConnectionResults> {
        let results: WebsiteBoilerplate.UpdateUserConnectionResults = {
            actionTaken: ClientConstants.UPDATE_USER_CONNECTION_ACTIONS.NONE,
            success: false,
            userConnection: connectionUpdates
        };

        try
        {
            let connectedUserUniqueId: string = connectionUpdates.uniqueId;
            let connectedUser: UserInstance | null = await this.getUserWithUniqueId(connectedUserUniqueId);

            if (connectedUser) {
                let currentUser: UserInstance | null = await db.User.findOne({
                    where: {
                        uniqueId: currentUserUniqueId
                    },
                    include: [
                        {
                            model: db.UserConnection,
                            as: 'outgoingConnections',
                            required: false,
                            where: {
                                connectedUserId: connectedUser.id!
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
                                    required: false,
                                    include: [
                                        {
                                            model: db.User,
                                            as: 'blockingUsers',
                                            required: false,
                                            attributes: [
                                                'id'
                                            ],
                                            where: {
                                                uniqueId: currentUserUniqueId
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                });

                if (currentUser && currentUser.outgoingConnections) {
                    let outgoingConnections: UserConnectionInstance[] = currentUser.outgoingConnections;
                    let allConnectionTypes: UserConnectionTypeInstance[] = await this.getConnectionTypes();
                    let connectionTypes: WebsiteBoilerplate.UserConnectionTypeDictionary = connectionUpdates.connectionTypes!;

                    let incomingConnection: UserConnectionInstance | null = await db.UserConnection.findOne({
                        where: {
                            requestedUserId: connectedUser.id!,
                            connectedUserId: currentUser.id!
                        },
                        attributes: [
                            'id'
                        ]
                    });

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
                                    let connectionTypeRecord: UserConnectionTypeInstance | undefined = allConnectionTypes.find(elem => elem.displayName === key);

                                    if (connectionTypeRecord) {
                                        addConnectionTypes.push(connectionTypeRecord);
                                    }
                                }
                            }
                        });

                        if (addConnectionTypes.length > 0) {
                            await existingConnection.addConnectionTypes(addConnectionTypes);
                        }

                        let isBlocked: Boolean = false;

                        if (connectedUser.blockingUsers && connectedUser.blockingUsers.length > 1) {
                            isBlocked = true;
                        }

                        results = {
                            ...results,
                            actionTaken: ClientConstants.UPDATE_USER_CONNECTION_ACTIONS.UPDATED,
                            success: true,
                            userConnection: {
                                allowPublicAccess: connectedUser.allowPublicAccess,
                                connectedToCurrentUser: true, /* If we updated the connection, it means that they're connected to the user */
                                connectionTypes,
                                displayName: (connectedUser.displayNames && connectedUser.displayNames[0] ? connectedUser.displayNames[0].displayName : ''),
                                displayNameIndex: (connectedUser.displayNames && connectedUser.displayNames[0] ? connectedUser.displayNames[0].displayNameIndex : -1),
                                pfp: (connectedUser.profilePictures && connectedUser.profilePictures[0] ? `/i/u/${connectedUserUniqueId}/${connectedUser.profilePictures[0].fileName}` : '/i/s/pfpDefault.svgz'),
                                pfpSmall: (connectedUser.profilePictures && connectedUser.profilePictures[0] ? `/i/u/${connectedUserUniqueId}/${connectedUser.profilePictures[0].smallFileName}` : '/i/s/pfpDefault.svgz'),
                                isBlocked: false, /* Outgoing connections shouldn't be blocked */
                                isMutual: incomingConnection !== null,
                                profileName: connectedUser.profileName,
                                uniqueId: connectedUserUniqueId
                            }
                        };

                        return results;
                    }
                    else { // Else, this is a new connection
                        let newConnection: UserConnectionInstance = await db.UserConnection.create({
                            requestedUserId: currentUser.id!,
                            connectedUserId: connectedUser.id!
                        });

                        if (Object.keys(connectionTypes).length) {
                            let addConnectionTypes: UserConnectionTypeInstance[] = allConnectionTypes.filter(connectionType => connectionTypes[connectionType.displayName]);

                            if (addConnectionTypes.length > 0) {
                                await newConnection.addConnectionTypes(addConnectionTypes);
                            }
                        }

                        results = {
                            ...results,
                            actionTaken: ClientConstants.UPDATE_USER_CONNECTION_ACTIONS.ADDED,
                            success: true,
                            userConnection: {
                                allowPublicAccess: connectedUser.allowPublicAccess,
                                connectedToCurrentUser: true, /* They are now connected to the current user */
                                connectionTypes,
                                displayName: (connectedUser.displayNames && connectedUser.displayNames[0] ? connectedUser.displayNames[0].displayName : ''),
                                displayNameIndex: (connectedUser.displayNames && connectedUser.displayNames[0] ? connectedUser.displayNames[0].displayNameIndex : -1),
                                pfp: (connectedUser.profilePictures && connectedUser.profilePictures[0] ? `/i/u/${connectedUserUniqueId}/${connectedUser.profilePictures[0].fileName}` : '/i/s/pfpDefault.svgz'),
                                pfpSmall: (connectedUser.profilePictures && connectedUser.profilePictures[0] ? `/i/u/${connectedUserUniqueId}/${connectedUser.profilePictures[0].smallFileName}` : '/i/s/pfpDefault.svgz'),
                                isBlocked: false, /* Outgoing connections shouldn't be blocked */
                                isMutual: incomingConnection !== null,
                                profileName: connectedUser.profileName,
                                uniqueId: connectedUserUniqueId
                            }
                        };

                        return results;
                    }
                }
            }
        }
        catch (err)
        {
            console.error(`Failed to update outgoing connection for user ${currentUserUniqueId}:\n${err.message}`);
        }

        return results;
    }

    // User Blocking
    async blockUser(currentUserUniqueId: string, blockUserUniqueId: string): Promise<Boolean> {
        try {
            let currentUser: UserInstance | null = await this.getUserWithUniqueId(currentUserUniqueId);
            let blockedUser: UserInstance | null = await this.getUserWithUniqueId(blockUserUniqueId);

            if (currentUser && blockedUser) {
                await currentUser.addBlockedUser(blockedUser);

                // Invalidate the cache for all possible calls with the two users since the result will have changed
                this.checkIfFirstUserIsBlockingSecond.delete(currentUser.id!, blockedUser.id!);
                this.checkIfFirstUserIsBlockingSecond.delete(currentUser.uniqueId!, blockedUser.id!);
                this.checkIfFirstUserIsBlockingSecond.delete(currentUser.id!, blockedUser.uniqueId!);
                this.checkIfFirstUserIsBlockingSecond.delete(currentUser.uniqueId!, blockedUser.uniqueId!);

                return true;
            }
        }
        catch (err) {
            console.error(`Error blocking user with unique id [${blockUserUniqueId}] for user with unique id [${currentUserUniqueId}]:\n${err.message}`);
        }

        return false;
    }

    async unblockUser(currentUserUniqueId: string, unblockUserUniqueId: string): Promise<Boolean> {
        try {
            let currentUser: UserInstance | null = await this.getUserWithUniqueId(currentUserUniqueId);
            let blockedUser: UserInstance | null = await this.getUserWithUniqueId(unblockUserUniqueId);

            if (currentUser && blockedUser) {
                await currentUser.removeBlockedUser(blockedUser);

                // Invalidate the cache for all possible calls with the two users since the result will have changed
                this.checkIfFirstUserIsBlockingSecond.delete(currentUser.id!, blockedUser.id!);
                this.checkIfFirstUserIsBlockingSecond.delete(currentUser.uniqueId!, blockedUser.id!);
                this.checkIfFirstUserIsBlockingSecond.delete(currentUser.id!, blockedUser.uniqueId!);
                this.checkIfFirstUserIsBlockingSecond.delete(currentUser.uniqueId!, blockedUser.uniqueId!);

                return true;
            }
        }
        catch (err) {
            console.error(`Error unblocking user with unique id [${unblockUserUniqueId}] for user with unique id [${currentUserUniqueId}]:\n${err.message}`);
        }

        return false;
    }

    // *********************
    // Post Methods
    // *********************

    // The end date is used to prevent new posts from coming back and winding up inserted in a strange place in the list. If they want the latest posts, they'll have to refresh the page
    async getPostsByUser(requestingUserUniqueId: string | undefined, postedByUniqueId: string | undefined, profileName: string | undefined, postType: number | null, endDate: Date | undefined, pageNumber: number | undefined): Promise<{posts: WebsiteBoilerplate.Post[], total: number}> {
        let posts: WebsiteBoilerplate.Post[] = [];
        let total: number = 0;

        try {
            let registeredUser: UserInstance | null = null;
            
            if (!isNullOrWhiteSpaceOnly(postedByUniqueId)) {
                registeredUser = await this.getUserWithUniqueId(postedByUniqueId!);
            }
            else if (!isNullOrWhiteSpaceOnly(profileName)) {
                registeredUser = await this.getUserWithProfileName(profileName!);
            }

            if (registeredUser) {
                let registeredUserId: number = registeredUser.id!;

                // Set it just in case it's not set already
                postedByUniqueId = registeredUser.uniqueId;

                // Make sure the user can view the posts
                let canView: Boolean = false;
                let isPublicUser: Boolean = isNullOrWhiteSpaceOnly(requestingUserUniqueId);

                if (requestingUserUniqueId === postedByUniqueId) {
                    // You can always view your own posts
                    canView = true;
                }
                /*## Disabled for testing
                else if (await this.checkUserForRole(registeredUser.id!, 'Administrator')) {
                    // Administrators can view all posts
                    canView = true;
                }*/
                else if (isPublicUser && registeredUser.allowPublicAccess) {
                    // Public users can view posts of registered users that allow it
                    canView = true;
                }
                else if (!isPublicUser && !(await this.checkIfFirstUserIsBlockingSecond(registeredUserId, requestingUserUniqueId!))) {
                    // If the requesting user is an actual user and they're not blocked
                    canView = true;
                }

                if (canView) {
                    // This has to be done separate due to the fact that the files are being joined in, 
                    // thus causing single posts to be counted multiple times when there are multiple 
                    // images for a particular post
                    let count: number = await db.Views.FeedView.count({
                        where: {
                            userUniqueId: isPublicUser ? { [Op.is]: null } : requestingUserUniqueId,
                            postedByUniqueId,
                            postedOn: {
                                [Op.lte]: endDate || new Date(Date.now())
                            }
                        }
                    });

                    let rows: FeedViewInstance[] = await db.Views.FeedView.findAll({
                        where: {
                            userUniqueId: isPublicUser ? { [Op.is]: null } : requestingUserUniqueId,
                            postedByUniqueId,
                            postedOn: {
                                [Op.lte]: endDate || new Date(Date.now())
                            }
                        },
                        order: [
                            ['id', 'DESC']
                        ],
                        include: [
                            {
                                model: db.PostFile,
                                as: 'postFiles'
                            }
                        ],
                        offset: (pageNumber || 0) * ServerConstants.DB_FEED_FETCH_PAGE_SIZE,
                        limit: ServerConstants.DB_FEED_FETCH_PAGE_SIZE,
                        subQuery: false // See subquery note
                    });

                    posts = rows.map(row => {
                        let dbPostFiles: PostFileInstance[] | undefined = row.postFiles;
                        let postFiles: WebsiteBoilerplate.PostFileInfo[] | undefined = undefined;
        
                        if (dbPostFiles && dbPostFiles.length > 0) {
                            let filePath: string = `/i/u/${postedByUniqueId}/`;
        
                            switch (row.postType) {
                                case ClientConstants.POST_TYPES.AUDIO:
                                    filePath += 'a/';
                                    break;
                                case ClientConstants.POST_TYPES.IMAGE:
                                    filePath += 'i/';
                                    break;
                                case ClientConstants.POST_TYPES.VIDEO:
                                    filePath += 'v/';
                                    break;
                                default:
                                    break;
                            }
        
                            postFiles = dbPostFiles.map(dbPostFile => ({
                                fileName: `${filePath}${dbPostFile.fileName}`,
                                mimeType: dbPostFile.mimeType,
                                originalFileName: dbPostFile.originalFileName,
                                size: dbPostFile.fileSize,
                                thumbnailFileName: dbPostFile.thumbnailFileName ? `${filePath}${dbPostFile.thumbnailFileName}` : undefined
                            }));
                        }
        
                        return {
                            lastEditedOn: row.lastEditedOn,
                            commentCount: row.commentCount,
                            postedOn: row.postedOn,
                            postText: row.postText,
                            postTitle: row.postTitle,
                            postType: row.postType,
                            postedBy: {
                                displayName: row.postedByDisplayName,
                                displayNameIndex: row.postedByDisplayNameIndex,
                                pfpSmall: row.postedByPfpSmall ? `/i/u/${postedByUniqueId!}/${row.postedByPfpSmall}` : '/i/s/pfpDefault.svgz',
                                profileName: row.postedByProfileName,
                                uniqueId: postedByUniqueId!
                            },
                            uniqueId: row.uniqueId,
                            postFiles
                        };
                    });
        
                    total = ((count as unknown) as Array<{count: number}>).length ? ((count as unknown) as Array<{count: number}>).length : count;
                }
            }
        }
        catch (err) {
            console.error(`Error getting posts for user ${postedByUniqueId}:\n${err.message}`);
        }

        return {posts, total};
    }

    // The end date is used to prevent new posts from coming back and winding up inserted in a strange place in the list. If they want the latest posts, they'll have to refresh the page
    async getFeed(uniqueId: string | number | undefined, postType: number | undefined, endDate: Date | undefined, pageNumber: number | undefined): Promise<{posts: WebsiteBoilerplate.Post[], total: number}> {
        let posts: WebsiteBoilerplate.Post[] = [];
        let total: number = 0;

        if (typeof uniqueId === 'number') {
            uniqueId = await this.getUniqueIdForUserId(uniqueId);
        }

        if (uniqueId !== undefined) {
            // This has to be done separate due to the fact that the files are being joined in, 
            // thus causing single posts to be counted multiple times when there are multiple 
            // images for a particular post
            let whereOptions: {[key: string]: any;} = {
                userUniqueId: uniqueId,
                postedOn: {
                    [Op.lte]: endDate || new Date(Date.now())
                }
            };

            if (true) { //## User Preference: Show my posts in my feed
                whereOptions.postedByUniqueId = { [Op.ne]: uniqueId };
            }

            if (postType !== undefined && postType !== ClientConstants.POST_TYPES.ALL) {
                whereOptions.postType = postType;
            }
            
            const count: number = await db.Views.FeedView.count({
                where: whereOptions
            });

            const rows: FeedViewInstance[] = await db.Views.FeedView.findAll({
                where: whereOptions,
                order: [
                    ['id', 'DESC']
                ],
                include: [
                    {
                        model: db.PostFile,
                        as: 'postFiles'
                    }
                ],
                offset: (pageNumber || 0) * ServerConstants.DB_FEED_FETCH_PAGE_SIZE,
                limit: ServerConstants.DB_FEED_FETCH_PAGE_SIZE
            });

            posts = rows.map(row => {
                let dbPostFiles: PostFileInstance[] | undefined = row.postFiles;
                let postFiles: WebsiteBoilerplate.PostFileInfo[] | undefined = undefined;

                if (dbPostFiles && dbPostFiles.length > 0) {
                    let filePath: string = `/i/u/${row.postedByUniqueId}/`;

                    switch (row.postType) {
                        case ClientConstants.POST_TYPES.AUDIO:
                            filePath += 'a/';
                            break;
                        case ClientConstants.POST_TYPES.IMAGE:
                            filePath += 'i/';
                            break;
                        case ClientConstants.POST_TYPES.VIDEO:
                            filePath += 'v/';
                            break;
                        default:
                            break;
                    }

                    postFiles = dbPostFiles.map(dbPostFile => ({
                        fileName: `${filePath}${dbPostFile.fileName}`,
                        mimeType: dbPostFile.mimeType,
                        originalFileName: dbPostFile.originalFileName,
                        size: dbPostFile.fileSize,
                        thumbnailFileName: dbPostFile.thumbnailFileName ? `${filePath}${dbPostFile.thumbnailFileName}` : undefined
                    }));
                }

                return {
                    lastEditedOn: row.lastEditedOn,
                    commentCount: row.commentCount,
                    postedOn: row.postedOn,
                    postText: row.postText,
                    postTitle: row.postTitle,
                    postType: row.postType,
                    postedBy: {
                        displayName: row.postedByDisplayName,
                        displayNameIndex: row.postedByDisplayNameIndex,
                        pfpSmall: row.postedByPfpSmall ? `/i/u/${row.postedByUniqueId}/${row.postedByPfpSmall}` : '/i/s/pfpDefault.svgz',
                        profileName: row.postedByProfileName,
                        uniqueId: row.postedByUniqueId
                    },
                    uniqueId: row.uniqueId,
                    postFiles
                };
            });

            total = count;
        }

        return {posts, total};
    }

    async addNewPost(uniqueId: string, postType: number, postTitle: string | undefined, postText: string | undefined, audience: number, customAudience: string | undefined, postFiles: WebsiteBoilerplate.PostFileInfo[] | undefined): Promise<{newPost: WebsiteBoilerplate.Post | undefined, postId: number | undefined}> {
        try
        {
            let registeredUser: UserInstance | null = await this.getUserWithUniqueId(uniqueId);

            if (registeredUser) {
                let failedValidation: Boolean = false;

                // First, run server-side validation as a last minute check to try to prevent bad posts
                if (postTitle && postTitle.length > 50) {
                    failedValidation = true;
                }
                else if (postText && postText.length > 2000) {
                    failedValidation = true;
                }

                // If there are files, verify only the allowed amounts are present and that the mimetypes are correct
                let fileCount: number = 0;
                let filePath: string = `/i/u/${registeredUser.uniqueId}/`;

                switch (postType) {
                    case ClientConstants.POST_TYPES.AUDIO:
                        if (isNullOrWhiteSpaceOnly(postTitle)) {
                            failedValidation = true;
                        }

                        filePath += 'a/';
                        break;
                    case ClientConstants.POST_TYPES.IMAGE:
                        filePath += 'i/';
                        break;
                    case ClientConstants.POST_TYPES.VIDEO:
                        if (isNullOrWhiteSpaceOnly(postTitle)) {
                            failedValidation = true;
                        }

                        filePath += 'v/';
                        break;
                    default:
                        if (isNullOrWhiteSpaceOnly(postText)) {
                            failedValidation = true;
                        }

                        break;
                }

                if (postFiles) {
                    fileCount = postFiles.length;

                    // Last minute check to prevent uploading more files than allowed
                    if (fileCount > 0) {
                        switch (postType) {
                            case ClientConstants.POST_TYPES.AUDIO: {
                                let audioFile: WebsiteBoilerplate.PostFileInfo = postFiles[0];
                                let foundError: Boolean = false;

                                if (fileCount > 1) {
                                    postFiles.splice(1);
                                }

                                if (!audioFile.mimeType.startsWith('audio/')) {
                                    foundError = true;
                                }
                                else if (audioFile.originalFileName.length > 150) {
                                    foundError = true;
                                }

                                if (foundError) {
                                    postFiles = [];
                                }

                                break;
                            }
                            case ClientConstants.POST_TYPES.IMAGE: {
                                let foundError: Boolean = false;

                                if (fileCount > 4) {
                                    postFiles.splice(4);
                                }
    
                                if (postFiles.some(postFile => (!postFile.mimeType.startsWith('image/') || postFile.originalFileName.length > 150))) {
                                    foundError = true;
                                }

                                if (foundError) {
                                    postFiles = [];
                                }

                                break;
                            }
                            case ClientConstants.POST_TYPES.VIDEO: {
                                let videoFile: WebsiteBoilerplate.PostFileInfo = postFiles[0];
                                let foundError: Boolean = false;

                                if (fileCount > 1) {
                                    postFiles.splice(1);
                                }

                                if (!videoFile.mimeType.startsWith('video/')) {
                                    foundError = true;
                                }
                                else if (videoFile.originalFileName.length > 150) {
                                    foundError = true;
                                }

                                if (foundError) {
                                    postFiles = [];
                                }

                                break;
                            }
                            case ClientConstants.POST_TYPES.TEXT:
                            default: {
                                postFiles = [];

                                break;
                            }
                        }
                    }

                    fileCount = postFiles.length;
                }

                if ((fileCount === 0 && !postText) || failedValidation) {
                    return {newPost: undefined, postId: undefined};
                }

                let postedOn: Date = new Date(Date.now());
                let postUniqueId: string = uuidv4();

                let newPost: PostInstance | null = await db.Post.create({
                    audience,
                    postedOn,
                    postText: postText || null,
                    postTitle: postTitle || null,
                    postType,
                    registeredUserId: registeredUser.id!,
                    uniqueId: postUniqueId
                });

                if (newPost) {
                    let parsedConnectionTypes: string [] = [];

                    if (customAudience) {
                        parsedConnectionTypes = customAudience.split(',');

                        let connectionTypes: UserConnectionTypeInstance[] = await db.UserConnectionType.findAll({
                            where: {
                                displayName: {
                                    [Op.in]: parsedConnectionTypes
                                }
                            }
                        });

                        if (connectionTypes.length > 0) {
                            await newPost.addConnectionTypes(connectionTypes);
                        }
                    }

                    if (fileCount > 0) {
                        for (let postFile of postFiles!) {
                            await db.PostFile.create({
                                postId: newPost!.id,
                                registeredUserId: registeredUser.id!,
                                fileName: postFile.fileName,
                                fileSize: postFile.size,
                                mimeType: postFile.mimeType,
                                originalFileName: postFile.originalFileName,
                                thumbnailFileName: postFile.thumbnailFileName || null
                            });
                        }
                    }

                    let displayNames: DisplayNameInstance[] = registeredUser.displayNames!;
                    let displayName: DisplayNameInstance = displayNames[0];
                    let profilePictures: ProfilePictureInstance[] = registeredUser.profilePictures!;
                    let profilePicture: ProfilePictureInstance | undefined = profilePictures[0];

                    let returnPostFiles: WebsiteBoilerplate.PostFileInfo[] = [];

                    if (fileCount > 0) {
                        returnPostFiles = postFiles!.map(file => ({
                            ...file,
                            fileName: `${filePath}${file.fileName}`,
                            thumbnailFileName: file.thumbnailFileName ? `${filePath}${file.thumbnailFileName}` : undefined
                        }));
                    }

                    return { 
                        newPost: {
                            lastEditedOn: null,
                            commentCount: 0,
                            postedOn,
                            postText: postText || null,
                            postTitle: postTitle || null,
                            postType,
                            postedBy: {
                                displayName: displayName.displayName,
                                displayNameIndex: displayName.displayNameIndex,
                                pfpSmall: profilePicture ? `/i/u/${registeredUser.uniqueId}/${profilePicture.smallFileName}` : '/i/s/pfpDefault.svgz',
                                profileName: registeredUser.profileName,
                                uniqueId: registeredUser.uniqueId
                            },
                            uniqueId: postUniqueId,
                            postFiles: returnPostFiles
                        },
                        postId: newPost.id!
                    };
                }
            }
        }
        catch(err)
        {
            console.error(`Error adding new post:\n${err.message}`);
        }

        return {newPost: undefined, postId: undefined};
    }

    async getPost(userUniqueId: string | undefined, postUniqueId: string, commentUniqueId: string | undefined): Promise<WebsiteBoilerplate.Post | undefined> {
        let isPublicUser: Boolean = isNullOrWhiteSpaceOnly(userUniqueId);
        let postInfo: FeedViewInstance | null = await db.Views.FeedView.findOne({
            where: {
                uniqueId: postUniqueId,
                userUniqueId: isPublicUser ? { [Op.is]: null } : userUniqueId
            },
            include: [
                {
                    model: db.PostFile,
                    as: 'postFiles'
                }
            ],
            subQuery: false
        });

        if (postInfo) {
            let postComments: WebsiteBoilerplate.PostComment[] = [];
            let commentPage: number = 0;

            if (!isPublicUser && commentUniqueId !== undefined) {
                let endDate: Date = new Date(Date.now());
                let commentFound: Boolean = false;
                let fetchedCount: number = 0;

                do {
                    let { comments: fetchedComments }: { comments: WebsiteBoilerplate.PostComment[] } = await this.getCommentsForPost(userUniqueId!, postUniqueId, endDate, commentPage);
                    commentPage++;
                    fetchedCount = fetchedComments.length;

                    if (fetchedComments.find(fetchedComment => fetchedComment.uniqueId === commentUniqueId)) {
                        commentFound = true;
                        commentPage--; // Back the commentPage up one
                    }

                    postComments.push(...fetchedComments);

                } while (fetchedCount && !commentFound);

                if (!commentFound) {
                    postComments = [];
                }
            }

            let dbPostFiles: PostFileInstance[] | undefined = postInfo.postFiles;
            let postFiles: WebsiteBoilerplate.PostFileInfo[] | undefined = undefined;

            if (dbPostFiles && dbPostFiles.length > 0) {
                let filePath: string = `/i/u/${postInfo.postedByUniqueId}/`;

                switch (postInfo.postType) {
                    case ClientConstants.POST_TYPES.AUDIO:
                        filePath += 'a/';
                        break;
                    case ClientConstants.POST_TYPES.IMAGE:
                        filePath += 'i/';
                        break;
                    case ClientConstants.POST_TYPES.VIDEO:
                        filePath += 'v/';
                        break;
                    default:
                        break;
                }

                postFiles = dbPostFiles.map(dbPostFile => ({
                    fileName: `${filePath}${dbPostFile.fileName}`,
                    mimeType: dbPostFile.mimeType,
                    originalFileName: dbPostFile.originalFileName,
                    size: dbPostFile.fileSize,
                    thumbnailFileName: dbPostFile.thumbnailFileName ? `${filePath}${dbPostFile.thumbnailFileName}` : undefined
                }));
            }

            return {
                lastEditedOn: postInfo.lastEditedOn,
                commentCount: postInfo.commentCount,
                postedOn: postInfo.postedOn,
                postText: postInfo.postText,
                postTitle: postInfo.postTitle,
                postType: postInfo.postType,
                postedBy: {
                    displayName: postInfo.postedByDisplayName,
                    displayNameIndex: postInfo.postedByDisplayNameIndex,
                    pfpSmall: postInfo.postedByPfpSmall ? `/i/u/${postInfo.postedByUniqueId}/${postInfo.postedByPfpSmall}` : '/i/s/pfpDefault.svgz',
                    profileName: postInfo.postedByProfileName,
                    uniqueId: postInfo.postedByUniqueId
                },
                uniqueId: postInfo.uniqueId,
                postFiles,
                commentPage,
                postComments
            };
        }

        return undefined;
    }

    // The end date is used to prevent new comments from coming back and winding up inserted in a strange place in the list. If they want the latest comments, they'll have to refresh the page
    async getCommentsForPost(userUniqueId: string, postUniqueId: string, endDate: Date | undefined, pageNumber: number | undefined): Promise<{comments: WebsiteBoilerplate.PostComment[], total: number}> {
        let comments: WebsiteBoilerplate.PostComment[] = [];
        let total: number = 0;

        try {
            let registeredUser: UserInstance | null = await this.getUserWithUniqueId(userUniqueId);

            // Validate that this user can actually view the post
            let postInfo: FeedViewInstance | null = await db.Views.FeedView.findOne({
                attributes: [
                    'id'
                ],
                where: {
                    userUniqueId,
                    uniqueId: postUniqueId,
                    postedOn: {
                        [Op.lte]: endDate || new Date(Date.now())
                    }
                }
            });

            if (registeredUser && postInfo) {
                let isAdministrator: Boolean = await this.checkUserForRole(registeredUser.id!, 'Administrator');
                isAdministrator = false; //## Temp override for development

                let parentCommentInclude: Array<any> = [
                    {
                        model: db.User,
                        as: 'registeredUser',
                        attributes: [
                            'id'
                        ],
                        include: [
                            {
                                /* Include DisplayName only for parentComment previews */
                                model: db.DisplayName,
                                as: 'displayNames',
                                where: {
                                    isActive: true
                                },
                                attributes: [
                                    'displayName',
                                    'displayNameIndex'
                                ]
                            }
                        ]
                    }
                ];

                if (!isAdministrator) {
                    parentCommentInclude.push({
                        model: db.UserBlock,
                        as: 'userBlocks',
                        on: {
                            [Op.or]: [
                                {
                                    [Op.and]: [
                                        {
                                            'registered_user_id': {
                                                [Op.eq]: Sequelize.col('parentComment.registered_user_id')
                                            }
                                        },
                                        {
                                            'blocked_user_id': registeredUser.id!
                                        }
                                    ]
                                },
                                {
                                    [Op.and]: [
                                        {
                                            'blocked_user_id': {
                                                [Op.eq]: Sequelize.col('parentComment.registered_user_id')
                                            }
                                        },
                                        {
                                            'registered_user_id': registeredUser.id!
                                        }
                                    ]
                                }
                            ]
                        }
                    });
                }

                let postCommentInclude: Array<any> = [
                    {
                        model: db.User,
                        as: 'registeredUser',
                        attributes: [
                            'id',
                            'profileName',
                            'uniqueId'
                        ],
                        include: [
                            /* Include DisplayName and ProfilePicture for top-level comments */
                            {
                                model: db.DisplayName,
                                as: 'displayNames',
                                where: {
                                    isActive: true
                                },
                                attributes: [
                                    'displayName',
                                    'displayNameIndex'
                                ]
                            },
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
                                    'smallFileName'
                                ]
                            }
                        ]
                    },
                    {
                        model: db.PostComment,
                        as: 'parentComment',
                        required: false,
                        attributes: [
                            'commentText',
                            'uniqueId'
                        ],
                        include: parentCommentInclude
                    }
                ];

                if (!isAdministrator) {
                    postCommentInclude.push({
                        model: db.UserBlock,
                        as: 'userBlocks',
                        on: {
                            [Op.or]: [
                                {
                                    [Op.and]: [
                                        {
                                            'registered_user_id': {
                                                [Op.eq]: Sequelize.col('PostComment.registered_user_id')
                                            }
                                        },
                                        {
                                            'blocked_user_id': registeredUser.id!
                                        }
                                    ]
                                },
                                {
                                    [Op.and]: [
                                        {
                                            'blocked_user_id': {
                                                [Op.eq]: Sequelize.col('PostComment.registered_user_id')
                                            }
                                        },
                                        {
                                            'registered_user_id': registeredUser.id!
                                        }
                                    ]
                                }
                            ]
                        }
                    });
                }

                const {rows, count}: {rows: PostCommentInstance[]; count: number} = await db.PostComment.findAndCountAll({
                    where: {
                        postId: postInfo.id!
                    },
                    order: [
                        ['id', 'DESC']
                    ],
                    include: postCommentInclude,
                    offset: (pageNumber || 0) * ServerConstants.DB_COMMENT_FETCH_PAGE_SIZE,
                    limit: ServerConstants.DB_COMMENT_FETCH_PAGE_SIZE,
                    subQuery: false // See subquery note
                });

                comments = rows.map(row => {
                    let commenter: UserInstance = row.registeredUser!;
                    let displayNames: DisplayNameInstance[] = commenter.displayNames!;
                    let pfps: ProfilePictureInstance[] | undefined = commenter.profilePictures;
                    let parentComment: {
                        commentText: string;
                        postedBy: {
                            displayName: string;
                            displayNameIndex: number;
                        };
                        uniqueId: string;
                    } | undefined = row.parentCommentId /* If there's no parent comment, but there's a parent comment id, then the parent comment was deleted */
                        ? {
                            commentText: '{This Comment Not Available}',
                            postedBy: {
                                /* Do not display the user's name */
                                displayName: '',
                                /* A value of 0 will keep the #index from displaying */
                                displayNameIndex: 0
                            },
                            uniqueId: ''
                        }
                        : undefined;

                    let posterBlocked: Boolean = false;

                    if (row.userBlocks && row.userBlocks[0]) {
                        posterBlocked = true;
                    }

                    if (row.parentComment) {
                        let tempComment: PostCommentInstance = row.parentComment;
                        let parentCommenter: UserInstance = tempComment.registeredUser!;
                        let parentDisplayNames: DisplayNameInstance[] = parentCommenter.displayNames!;

                        // If there are no blocks on the parent comment
                        if (!(tempComment.userBlocks && tempComment.userBlocks[0])) {
                            // then we can fill in the parent comment with the actual data
                            parentComment = {
                                commentText: tempComment.commentText,
                                postedBy: {
                                    displayName: parentDisplayNames[0].displayName,
                                    displayNameIndex: parentDisplayNames[0].displayNameIndex
                                },
                                uniqueId: tempComment.uniqueId
                            };
                        }
                    }

                    return {
                        commentText: posterBlocked ? '{This Comment Not Available}' : row.commentText,
                        parentComment,
                        postedBy: {
                            /* Do not display the user's name */
                            displayName: posterBlocked ? '' : displayNames[0].displayName,
                            /* A value of 0 will keep the #index from displaying */
                            displayNameIndex: posterBlocked ? 0 : displayNames[0].displayNameIndex,
                            /* Display the default pfp if blocked */
                            pfpSmall: !posterBlocked && pfps && pfps[0] ? `/i/u/${commenter.uniqueId}/${pfps[0].smallFileName}` : '/i/s/pfpDefault.svgz',
                            profileName: posterBlocked ? '' : commenter.profileName,
                            uniqueId: posterBlocked ? '' : commenter.uniqueId
                        },
                        uniqueId: row.uniqueId
                    };
                });

                total = count;
            }
        }
        catch (err) {
            console.error(`Error looking up comments for post:\n${err.message}`);
        }

        return {comments, total};
    }

    async addNewPostComment(userUniqueId: string, postUniqueId: string, commentText: string, parentCommentUniqueId: string | undefined): Promise<WebsiteBoilerplate.PostComment | undefined> {
        try {
            // Validate that this user can actually comment on the post
            let postInfo: FeedViewInstance | null = await db.Views.FeedView.findOne({
                attributes: [
                    'id',
                    'postedByUniqueId',
                    'postTitle',
                    'uniqueId'
                ],
                where: {
                    userUniqueId,
                    uniqueId: postUniqueId
                }
            });

            let commenter: UserInstance | null = await this.getUserWithUniqueId(userUniqueId);
            
            if (postInfo && commenter) {
                let postAuthor: UserInstance | null = await this.getUserWithUniqueId(postInfo.postedByUniqueId);

                if (postAuthor) {
                    let postedOn: Date = new Date(Date.now());
                    let parentCommentId: number | undefined = undefined;
                    let parentComment: PostCommentInstance | null = null;

                    if (parentCommentUniqueId) {
                        parentComment = await db.PostComment.findOne({
                            attributes: [
                                'id',
                                'commentText',
                                'registeredUserId',
                                'uniqueId'
                            ],
                            where: {
                                uniqueId: parentCommentUniqueId
                            }
                        });

                        if (parentComment) {
                            parentCommentId = parentComment.id!;
                        }
                    }

                    let uniqueId: string = uuidv4();

                    let newPostComment: PostCommentInstance | null = await db.PostComment.create({
                        postedOn,
                        postId: postInfo.id!,
                        registeredUserId: commenter.id!,
                        commentText,
                        uniqueId,
                        parentCommentId
                    });

                    if (newPostComment) {
                        let commenterDisplayNames: DisplayNameInstance[] = commenter.displayNames!;
                        let commenterDisplayName: DisplayNameInstance = commenterDisplayNames[0];
                        let commenterProfilePictures: ProfilePictureInstance[] = commenter.profilePictures!;
                        let commenterProfilePicture: ProfilePictureInstance | undefined = commenterProfilePictures[0];
                        let commenterFullName: string = `${commenterDisplayName.displayName}${ commenterDisplayName.displayNameIndex === 0 ? '' : `#${commenterDisplayName.displayNameIndex}`}`;

                        let returnComment: WebsiteBoilerplate.PostComment = {
                            commentText,
                            postedBy: {
                                displayName: commenterDisplayName.displayName,
                                displayNameIndex: commenterDisplayName.displayNameIndex,
                                pfpSmall: commenterProfilePicture ? `/i/u/${commenter.uniqueId}/${commenterProfilePicture.smallFileName}` : '/i/s/pfpDefault.svgz',
                                profileName: commenter.profileName,
                                uniqueId: commenter.uniqueId
                            },
                            uniqueId
                        };

                        let postId: string = adjustGUIDDashes(postInfo.uniqueId)!;
                        let commentId: string | undefined = adjustGUIDDashes(uniqueId);

                        if (parentComment !== null) {
                            let parentCommenter: UserInstance | null = await this.getUserWithId(parentComment.registeredUserId);

                            if (parentCommenter) {
                                let parentCommenterDisplayNames: DisplayNameInstance[] = parentCommenter.displayNames!;
                                let parentCommenterDisplayName: DisplayNameInstance = parentCommenterDisplayNames[0];

                                returnComment.parentComment = {
                                    commentText: parentComment.commentText,
                                    postedBy: {
                                        displayName: parentCommenterDisplayName.displayName,
                                        displayNameIndex: parentCommenterDisplayName.displayNameIndex
                                    },
                                    uniqueId: parentComment.uniqueId
                                };

                                let postAuthorDisplayNames: DisplayNameInstance[] = postAuthor.displayNames!;
                                let postAuthorDisplayName: DisplayNameInstance = postAuthorDisplayNames[0];

                                let replyNotification: WebsiteBoilerplate.PostNotification = {
                                    commentId, 
                                    createdOn: postedOn, 
                                    message: `replied to your comment on ${postAuthorDisplayName.displayName}${postAuthorDisplayName.displayNameIndex === 0 ? '' : `#${commenterDisplayName.displayNameIndex}`}'s post`, 
                                    postId, 
                                    status: ClientConstants.NOTIFICATION_STATUS.UNSEEN, 
                                    triggeredBy: [commenterFullName],
                                    type: ClientConstants.NOTIFICATION_TYPES.COMMENT_REPLY,
                                    uniqueId: uuidv4() 
                                };

                                db.PostNotification.create({
                                    postId: postInfo.id,
                                    registeredUserId: parentCommenter.id!,
                                    commentId: newPostComment.id!,
                                    notificationType: ClientConstants.NOTIFICATION_TYPES.COMMENT_REPLY,
                                    createdOn: postedOn,
                                    triggeredByUserId: commenter.id!
                                });

                                SocketHelper.notifyUser(parentCommenter.uniqueId, ClientConstants.SOCKET_EVENTS.NOTIFY_USER.NEW_COMMENT, replyNotification);
                            };
                        }

                        let { postedByUniqueId }: { postedByUniqueId: string } = postInfo;
                        let message: string = `commented on ${postInfo.postTitle || 'your post'}`;

                        let postNotification: WebsiteBoilerplate.PostNotification = {
                            commentId, 
                            createdOn: postedOn, 
                            message, 
                            postId, 
                            status: ClientConstants.NOTIFICATION_STATUS.UNSEEN, 
                            triggeredBy: [commenterFullName],
                            type: ClientConstants.NOTIFICATION_TYPES.COMMENT,
                            uniqueId: uuidv4() 
                        };
                        
                        // Shouldn't have to wait for the Post Notification to be created
                        // let postNotification: PostNotificationInstance = await db.PostNotification.create({
                        db.PostNotification.create({
                            postId: postInfo.id,
                            registeredUserId: postAuthor.id!,
                            commentId: newPostComment.id!,
                            notificationType: 0,
                            createdOn: postedOn,
                            triggeredByUserId: commenter.id!
                        });

                        SocketHelper.notifyUser(postedByUniqueId, ClientConstants.SOCKET_EVENTS.NOTIFY_USER.NEW_COMMENT, postNotification);

                        return returnComment;
                    }
                }
            }
        }
        catch (err) {
            console.error(`Error adding new comment:\n${err.message}`);
        }

        return undefined;
    }
    
    async getPostNotifications(uniqueId: string): Promise<WebsiteBoilerplate.PostNotification[]> {
        let notifications: WebsiteBoilerplate.PostNotification[] = [];

        try {
            let registeredUser: UserInstance | null = await this.getUserWithUniqueId(uniqueId);

            if (registeredUser) {
                let postNotifications: PostNotificationInstance[] = await registeredUser.getPostNotifications({
                    include: [
                        {
                            model: db.User,
                            as: 'triggeredByUser',
                            attributes: [
                                'id'
                            ],
                            include: [
                                {
                                    model: db.DisplayName,
                                    as: 'displayNames',
                                    where: {
                                        isActive: true
                                    },
                                    attributes: [
                                        'displayName',
                                        'displayNameIndex'
                                    ]
                                }
                            ]
                        },
                        {
                            model: db.Post,
                            as: 'post',
                            attributes: [
                                'postTitle',
                                'uniqueId'
                            ]
                        },
                        {
                            model: db.PostComment,
                            as: 'comment',
                            required: false,
                            attributes: [
                                'uniqueId'
                            ]
                        }
                    ],
                    // Order ascending:
                    // If one user triggers multiple notifications for the same post, there will still only be one
                    // notification after they're processed. Because there will only be one notification for a single user,
                    // it will include the commentId in the notification. We want the commentId to be the oldest comment
                    // by the user, so by ordering ascending, the first comment to be hit and stored will be the oldest one.
                    // The notifications will then get sorted by date descending, making sure they end in the right order.
                    order: [['id', 'ASC']]
                });

                if (postNotifications.length > 0) {
                    let { postNotifications: filteredNotifications, purgeNotifications }: { postNotifications: WebsiteBoilerplate.PostNotification[], purgeNotifications: PostNotificationInstance[] } = notificationHelper.processPostNotifications(postNotifications);

                    notifications = filteredNotifications;

                    if (purgeNotifications.length > 0) {
                        db.PostNotification.destroy({
                            where: {
                                id: purgeNotifications.map(notification => notification.id!)
                            }
                        });
                    }
                }
            }
        }
        catch (err) {
            console.error(`Error getting post notifications for user ${uniqueId}:\n${err.message}`);
        }

        return notifications;
    }

    async markPostNotificationAsRead(uniqueId: string, postId: string, commentId: string | undefined, endDate: Date | undefined) {
        try {
            let registeredUserId: number | undefined = await this.getUserIdForUniqueId(uniqueId);

            if (registeredUserId) {
                let adjustedPostId: string | undefined = adjustGUIDDashes(postId, true);
                let adjustedCommentId: string | undefined = adjustGUIDDashes(commentId, true);

                if (adjustedPostId) {
                    let whereOptions: { [key: string]: any} = {
                        postId: {
                            [Op.eq]: Sequelize.literal(`(select \`id\` FROM \`post\` where \`post\`.\`unique_id\` = '${adjustedPostId}')`)
                        },
                        registeredUserId,
                        notificationStatus: {
                            [Op.ne]: ClientConstants.NOTIFICATION_STATUS.READ /* Knock out unseen and unread at the same time */
                        }
                    };

                    if (adjustedCommentId) {
                        // There could be multiple comments by the same user, but we'd only get one comment id (the oldest one)
                        // so just mark all notifications by that user as read
                        let notification: PostNotificationInstance | null = await db.PostNotification.findOne({
                            attributes: [
                                'triggeredByUserId'
                            ],
                            where: {
                                commentId: {
                                    [Op.eq]: Sequelize.literal(`(select \`id\` FROM \`post_comment\` where \`post_comment\`.\`unique_id\` = '${adjustedCommentId}')`)
                                },
                                postId: {
                                    [Op.eq]: Sequelize.literal(`(select \`id\` FROM \`post\` where \`post\`.\`unique_id\` = '${adjustedPostId}')`)
                                },
                                registeredUserId
                            }
                        });

                        if (notification) {
                            whereOptions.triggeredByUserId = notification.triggeredByUserId;
                        }
                    }
                    
                    if (endDate) {
                        whereOptions.createdOn = {
                            [Op.lte]: endDate
                        };
                    }

                    // Don't need to wait
                    db.PostNotification.update({
                            notificationStatus: ClientConstants.NOTIFICATION_STATUS.READ
                        },
                        {
                            where: whereOptions
                        }
                    );
                }
            }
        }
        catch (err) {
            console.error(`Error marking unseen notifications as read:\n${err.message}`);
        }
    }

    async markAllPostNotificationsAsSeen(uniqueId: string, endDate: Date | undefined) {
        try {
            let registeredUserId: number | undefined = await this.getUserIdForUniqueId(uniqueId);

            if (registeredUserId) {
                let whereOptions: { [key: string]: any} = {
                    registeredUserId,
                    notificationStatus: ClientConstants.NOTIFICATION_STATUS.SEEN_ONCE,
                };

                if (endDate) {
                    whereOptions.createdOn = {
                        [Op.lte]: endDate
                    };
                }

                // Mark all that they've seen at least once before as Unread
                // Need to wait so we don't accidentally update the same notification twice
                await db.PostNotification.update({
                        notificationStatus: ClientConstants.NOTIFICATION_STATUS.UNREAD
                    },
                    {
                        where: whereOptions
                    }
                );

                whereOptions.notificationStatus = ClientConstants.NOTIFICATION_STATUS.UNSEEN;

                // Mark all that they haven't seen as Seen Once
                // Don't need to wait
                db.PostNotification.update({
                        notificationStatus: ClientConstants.NOTIFICATION_STATUS.SEEN_ONCE
                    },
                    {
                        where: whereOptions
                    }
                );
            }
        }
        catch (err) {
            console.error(`Error marking unseen notifications as seen/unread:\n${err.message}`);
        }
    }

    async removePostNotifications(uniqueId: string, postId: string, commentId: string | undefined, endDate: Date | undefined) {
        try {
            let registeredUserId: number | undefined = await this.getUserIdForUniqueId(uniqueId);

            if (registeredUserId) {
                let adjustedPostId: string | undefined = adjustGUIDDashes(postId, true);
                let adjustedCommentId: string | undefined = adjustGUIDDashes(commentId, true);

                if (adjustedPostId) {
                    let whereOptions: { [key: string]: any} = {
                        postId: {
                            [Op.eq]: Sequelize.literal(`(select \`id\` FROM \`post\` where \`post\`.\`unique_id\` = '${adjustedPostId}')`)
                        },
                        registeredUserId
                    };

                    if (adjustedCommentId) {
                        // There could be multiple comments by the same user, but we'd only get one comment id (the oldest one)
                        // so just clear out all notifications by that user
                        let notification: PostNotificationInstance | null = await db.PostNotification.findOne({
                            attributes: [
                                'triggeredByUserId'
                            ],
                            where: {
                                commentId: {
                                    [Op.eq]: Sequelize.literal(`(select \`id\` FROM \`post_comment\` where \`post_comment\`.\`unique_id\` = '${adjustedCommentId}')`)
                                },
                                postId: {
                                    [Op.eq]: Sequelize.literal(`(select \`id\` FROM \`post\` where \`post\`.\`unique_id\` = '${adjustedPostId}')`)
                                },
                                registeredUserId
                            }
                        });

                        if (notification) {
                            whereOptions.triggeredByUserId = notification.triggeredByUserId;
                        }
                    }

                    if (endDate) {
                        whereOptions.createdOn = {
                            [Op.lte]: endDate
                        };
                    }

                    await db.PostNotification.destroy({
                        where: whereOptions
                    });
                }
            }
        }
        catch (err) {
            console.error(`Error removing notifications:\n${err.message}`);
        }
    }

    async updateThumbnailForPostFile(postId: number, thumbnailFileName: string) {
        try {
            let postFile: PostFileInstance | null = await db.PostFile.findOne({
                where: {
                    postId
                }
            });

            if (postFile) {
                postFile.thumbnailFileName = thumbnailFileName;
                await postFile.save();
            }
        }
        catch (err) {
            console.error(`Error updating thumbnail for postFile:\n${err.message}`);
        }
    }
};

export let databaseHelper: DatabaseHelper = new DatabaseHelper();
