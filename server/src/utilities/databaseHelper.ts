import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

import bcrypt from 'bcryptjs';

import * as Constants from '../constants/constants';
import NodeCache from 'node-cache';

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
import { UserBlockInstance } from '../models/UserBlock';

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

    async userExistsForProfileName(profileName: string): Promise<{exists: Boolean, allowPublicAccess: Boolean}> {
        try
        {
            let registeredUser: UserInstance | null = await db.User.findOne({
                where: {
                    profileName: profileName.toLowerCase()
                },
                attributes: [
                    'allowPublicAccess'
                ]
            });

            if (registeredUser) {
                return {exists: true, allowPublicAccess: registeredUser.allowPublicAccess!};
            }
        }
        catch (err)
        {
            console.error(`Error looking up user with profile name ${profileName}:\n${err.message}`);
        }

        return {exists: false, allowPublicAccess: false};
    }

    async getProfileInfo(currentUniqueId: string | undefined, profileName: string, includeEmail: Boolean): Promise<WebsiteBoilerplate.ProfileInfo | null> {
        try {
            let currentUserId: number | undefined = await this.getUserIdForUniqueId(currentUniqueId || '-1');
            let isPublicUser: Boolean = currentUserId === undefined;
            let connectionTypes: WebsiteBoilerplate.UserConnectionTypeDictionary = {};

            let queryOptions: {[key: string]: any;} = {
                where: {
                    profileName: profileName.toLowerCase()
                },
                attributes: [
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
                });
            }

            let registeredUser: UserInstance | null = await db.User.findOne(queryOptions);

            if (registeredUser) {
                let displayNames: DisplayNameInstance[] | undefined = registeredUser.displayNames;
                let displayName: DisplayNameInstance | null = displayNames && displayNames.length > 0 ? displayNames[0] : null;

                let profilePictures: ProfilePictureInstance[] | undefined = registeredUser.profilePictures;
                let profilePicture: ProfilePictureInstance | null = profilePictures && profilePictures.length > 0 ? profilePictures[0] : null;

                if (isPublicUser) {
                    return {
                        displayName: displayName ? displayName.displayName : '',
                        displayNameIndex: displayName ? displayName.displayNameIndex : -1,
                        pfpSmall: profilePicture ? `/i/u/${registeredUser.uniqueId}/${profilePicture.smallFileName}` : '/i/s/pfpDefault.svgz',
                        uniqueId: registeredUser.uniqueId
                    };
                }
                else {
                    let userConnectionTypes: WebsiteBoilerplate.UserConnectionTypeDictionary = {};
                        
                    if (registeredUser.incomingConnections && registeredUser.incomingConnections[0] && registeredUser.incomingConnections[0].connectionTypes) {
                        let incomingTypes: UserConnectionTypeInstance[] = registeredUser.incomingConnections[0].connectionTypes!;
                        userConnectionTypes = incomingTypes.reduce((previousValue, connectionType) => ({
                            ...previousValue,
                            [connectionType.displayName]: true
                        }), {});
                    }

                    return {
                        displayName: displayName ? displayName.displayName : '',
                        displayNameIndex: displayName ? displayName.displayNameIndex : -1,
                        pfpSmall: profilePicture ? `/i/u/${registeredUser.uniqueId}/${profilePicture.smallFileName}` : '/i/s/pfpDefault.svgz',
                        uniqueId: registeredUser.uniqueId,
                        connectionTypes: {
                            ...connectionTypes,
                            ...userConnectionTypes
                        }
                    };
                }
            }
        }
        catch (err) {
            console.error(`Error looking up user with profile name ${profileName}: ${err.message}`);
        }

        return null;
    }

    async getUserIdForUniqueId(uniqueId: string): Promise<number | undefined> {
        try
        {
            let registeredUser: UserInstance | null = await db.User.findOne({
                where: {
                    uniqueId
                }
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

    async getUserWithUniqueId(uniqueId: string): Promise<UserInstance | null> {
        try
        {
            let registeredUser: UserInstance | null = await db.User.findOne({
                where: {
                    uniqueId
                }
            });

            return registeredUser;
        }
        catch (err)
        {
            console.error(`Error looking up user with uniqueId ${uniqueId}: ${err.message}`);
        }
        
        return null;
    }

    async registerNewUser(email: string, displayName: string, profileName: string, password: string): Promise<{id: string | null, success: Boolean}> {
        try
        {
            if (!displayName || displayName.length > 100 || displayName.indexOf('#') > -1) {
                return {id: null, success: false};
            }
            else if (!profileName || profileName.length > 20 || !Constants.PROFILE_NAME_REGEX.test(profileName)) {
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
                if (registeredUser.passwordResetTokens && registeredUser.passwordResetTokens.length < Constants.RPT_MAX_ACTIVE_TOKENS) {
                    token = uuidv4();

                    let expirationDate: Date = new Date(Date.now()).addMinutes(Constants.RPT_EXPIRATION_MINUTES);

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

    async addProfilePictureToUser(fileName: string, smallFileName: string, originalFileName: string, mimeType: string, userId: string): Promise<{success: Boolean}> {
        try
        {
            let registeredUser: UserInstance | null = await this.getUserWithUniqueId(userId);
            
            if (registeredUser) {
                let newPFP: ProfilePictureInstance | null = await registeredUser.createProfilePicture({
                    fileName,
                    smallFileName,
                    originalFileName
                });

                if (newPFP) {
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
            let registeredUser: UserInstance | null = await db.User.findOne({
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

            let registeredUser: UserInstance | null = await db.User.findOne({
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

            let registeredUser: UserInstance | null = await db.User.findOne({
                where: {
                    uniqueId
                },
                attributes: [
                    'id', /* This is necessary to select so the lazy loading of incomingConnections below will work */
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
                let userDetails: WebsiteBoilerplate.UserDetails = {
                    displayName: (registeredUser.displayNames && registeredUser.displayNames[0] ? registeredUser.displayNames[0].displayName : ''),
                    displayNameIndex: (registeredUser.displayNames && registeredUser.displayNames[0] ? registeredUser.displayNames[0].displayNameIndex : -1),
                    pfp: (registeredUser.profilePictures && registeredUser.profilePictures[0] ? `/i/u/${uniqueId}/${registeredUser.profilePictures[0].fileName}` : '/i/s/pfpDefault.svgz'),
                    pfpSmall: (registeredUser.profilePictures && registeredUser.profilePictures[0] ? `/i/u/${uniqueId}/${registeredUser.profilePictures[0].smallFileName}` : '/i/s/pfpDefault.svgz'),
                    roles: (registeredUser.roles ? registeredUser.roles.map(role => role.roleName) : []),
                    uniqueId,
                    profileName: registeredUser.profileName,
                    isBlocked: false /* ##TODO */,
                    isMutual: false /* ##TODO */
                };

                if (includeEmail) {
                    userDetails.email = registeredUser.email;
                }

                if (getConnectionTypes) {
                    let currentUser: UserInstance | null = await this.getUserWithUniqueId(currentUniqueId!);

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

                        if (incomingConnections.length > 0) {
                            let connectionTypes: WebsiteBoilerplate.UserConnectionTypeDictionary;

                            if (incomingConnections[0].connectionTypes) {
                                connectionTypes = incomingConnections[0].connectionTypes.reduce((previousValue, connectionType) => ({
                                    ...previousValue,
                                    [connectionType.displayName]: true
                                }), {});
                            }
                            else {
                                connectionTypes = {};
                            }

                            userDetails.connectionTypes = connectionTypes;
                        }

                        let outgoingConnections: UserConnectionInstance[] = await registeredUser.getOutgoingConnections({
                            where: {
                                connectedUserId: currentUser.id!
                            }
                        });

                        if (outgoingConnections.length > 0) {
                            userDetails.connectedToCurrentUser = true;
                        }

                        let blockedUsers: UserInstance[] = await currentUser.getBlockedUsers({
                            where: {
                                blockedUserId: registeredUser.id!
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

    async checkUserForRole(uniqueId: string, roleName: string): Promise<Boolean> {
        try
        {
            let registeredUser: UserInstance | null = await db.User.findOne({
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

            if (registeredUser) {
                return true;
            }
        }
        catch (err) {
            console.error(`Error checking role (${roleName}) for user ${uniqueId}:\n${err.message}`);
        }

        return false;
    }

    async searchUsers(currentUserUniqueId: string, displayNameFilter: string, displayNameIndexFilter: number, pageNumber: number, excludeConnections: Boolean): Promise<WebsiteBoilerplate.UserSearchResults | null> {
        try {
            let currentUserId: number | undefined = await this.getUserIdForUniqueId(currentUserUniqueId);

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
                        Sequelize.where(Sequelize.cast(Sequelize.col('DisplayName.display_name_index'), 'char'), {
                            [Op.like]: `${displayNameIndexFilter}%`
                        })
                    ]
                };
            }

            if (excludeConnections && currentUserId) {
                // This will get all of the incoming connections to the current user
                let connectionViewRecords: UserConnectionViewInstance[] | null = await db.Views.UserConnectionView.findAll({
                    where: {
                        connectedUserId: currentUserId,
                        isMutual: true
                    }
                });

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
                    return {
                        displayName: displayName.displayName, 
                        displayNameIndex: displayName.displayNameIndex, 
                        isBlocked: false, /* ##TODO */
                        isMutual: false, /* ##TODO */
                        pfp: (displayName.registeredUser!.profilePictures && displayName.registeredUser!.profilePictures[0] ? `/i/u/${displayName.registeredUser!.uniqueId}/${displayName.registeredUser!.profilePictures[0].fileName}` : '/i/s/pfpDefault.svgz'),
                        pfpSmall: (displayName.registeredUser!.profilePictures && displayName.registeredUser!.profilePictures[0] ? `/i/u/${displayName.registeredUser!.uniqueId}/${displayName.registeredUser!.profilePictures[0].smallFileName}` : '/i/s/pfpDefault.svgz'),
                        profileName: displayName.registeredUser!.profileName,
                        uniqueId: displayName.registeredUser!.uniqueId
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

            let registeredUserId: number | undefined = await this.getUserIdForUniqueId(uniqueId);

            if (registeredUserId !== undefined) {
                let outgoingConnectionsView: UserConnectionViewInstance[] | null = await db.Views.UserConnectionView.findAll({
                    where: {
                        requestedUserId: registeredUserId
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
                                pfpSmall: (connectedUser!.profilePictures && connectedUser!.profilePictures[0] ? `/i/u/${uniqueId}/${connectedUser!.profilePictures[0].smallFileName}` : '/i/s/pfpDefault.svgz'),
                                isBlocked: false, /* ##TODO */
                                isMutual: connectionView.isMutual,
                                connectionTypes: {...connectionTypes, ...userConnectionTypes},
                                profileName: connectedUser!.profileName
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
                    return incomingConnectionsView.reduce((previousValue, connectionView) => {
                        let connection: UserConnectionInstance = connectionView.userConnection!;
                        let requestedUser: UserInstance = connection.requestedUser!;

                        let mutualConnection: UserConnectionInstance | undefined = connectionView.mutualConnection;
                        let userConnectionTypes: WebsiteBoilerplate.UserConnectionTypeDictionary = {};
                        
                        if (mutualConnection && mutualConnection.connectionTypes) {
                            userConnectionTypes = mutualConnection.connectionTypes.reduce((previousValue, connectionType) => ({
                                ...previousValue,
                                [connectionType.displayName]: true
                            }), {});
                        }

                        return {
                            ...previousValue,
                            [requestedUser.uniqueId]: {
                                displayName: (requestedUser.displayNames && requestedUser.displayNames[0] ? requestedUser.displayNames[0].displayName : ''),
                                displayNameIndex: (requestedUser.displayNames && requestedUser.displayNames[0] ? requestedUser.displayNames[0].displayNameIndex : -1),
                                pfpSmall: (requestedUser.profilePictures && requestedUser.profilePictures[0] ? `/i/u/${uniqueId}/${requestedUser.profilePictures[0].smallFileName}` : '/i/s/pfpDefault.svgz'),
                                isBlocked: false, /* ##TODO */
                                isMutual: connectionView.isMutual,
                                connectionTypes: {...connectionTypes, ...userConnectionTypes},
                                profileName: requestedUser.profileName
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
        try {
            let connectionTypesDict: WebsiteBoilerplate.UserConnectionTypeDictionary | undefined = this.nodeCache.get(Constants.CACHE_KEY_CONNECTION_TYPES_DICT);

            if (!connectionTypesDict) {
                let connectionTypes: UserConnectionTypeInstance[] = await this.getConnectionTypes();

                connectionTypesDict = connectionTypes.reduce((previousValue, currentValue) => {
                    return {
                        ...previousValue,
                        [currentValue.displayName]: false
                    }
                }, {});

                this.nodeCache.set(Constants.CACHE_KEY_CONNECTION_TYPES_DICT, connectionTypesDict, Constants.CONNECTION_TYPES_CACHE_HOURS * 60 * 60 * 1000);
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

    async removeUserConnection(currentUserUniqueId: string, connectedUserUniqueId: string): Promise<Boolean> {
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
                
                if (userConnection) {
                    await userConnection.destroy();
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
            let connectedUserUniqueId: string = Object.keys(outgoingConnectionUpdates)[0];
            let connectedUser: UserInstance | null = await this.getUserWithUniqueId(connectedUserUniqueId);

            if (connectedUser) {
                let currentUser: UserInstance | null = await db.User.findOne({
                    where: {
                        uniqueId
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
                                    required: false
                                }
                            ]
                        }
                    ]
                });

                if (currentUser && currentUser.outgoingConnections) {
                    let outgoingConnections: UserConnectionInstance[] = currentUser.outgoingConnections;
                    let allConnectionTypes: UserConnectionTypeInstance[] = await this.getConnectionTypes();
                    let details: WebsiteBoilerplate.UserDetails = outgoingConnectionUpdates[connectedUserUniqueId];
                    let connectionTypes: WebsiteBoilerplate.UserConnectionTypeDictionary = details.connectionTypes!;

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

                        return true;
                    }
                    else {
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

    // User Blocking
    async blockUser(currentUserUniqueId: string, blockUserUniqueId: string): Promise<Boolean> {
        try {
            let currentUser: UserInstance | null = await this.getUserWithUniqueId(currentUserUniqueId);
            let blockedUser: UserInstance | null = await this.getUserWithUniqueId(blockUserUniqueId);

            if (currentUser && blockedUser) {
                await currentUser.addBlockedUser(blockedUser);

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

                return true;
            }
        }
        catch (err) {
            console.error(`Error unblocking user with unique id [${unblockUserUniqueId}] for user with unique id [${currentUserUniqueId}]:\n${err.message}`);
        }

        return false;
    }
};

export let databaseHelper: DatabaseHelper = new DatabaseHelper();
