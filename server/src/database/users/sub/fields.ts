import memoize from 'memoizee';

import * as ClientConstants from '../../../constants/constants.client';
import * as ServerConstants from '../../../constants/constants.server';

import { models } from '../../../models/_index';
import { DisplayNameInstance } from '../../../models/DisplayName';
import { ProfilePictureInstance } from '../../../models/ProfilePicture';
import { UserPreferencesInstance } from '../../../models/UserPreferences';
import { UserInstance } from '../../../models/User';

import { isNullOrWhiteSpaceOnly } from '../../../utilities/utilityFunctions';

import { getUserWithUniqueId } from './searches';

export const addProfilePictureToUser = async function(fileName: string, smallFileName: string, originalFileName: string, mimeType: string, userUniqueId: string, flagType: number): Promise<{success: Boolean, pfp?: string, pfpSmall?: string}> {
    try
    {
        let registeredUser: UserInstance | null = await getUserWithUniqueId(userUniqueId);
        
        if (registeredUser) {
            let newPFP: ProfilePictureInstance | null = await registeredUser.createProfilePicture({
                fileName,
                flagType,
                mimeType,
                originalFileName,
                smallFileName
            });

            if (newPFP) {
                return {
                    success: true, 
                    pfp: `${ClientConstants.PUBLIC_USER_PATH}${userUniqueId}/${fileName}`,
                    pfpSmall: `${ClientConstants.PUBLIC_USER_PATH}${userUniqueId}/${smallFileName}`
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

export const getPFPFileNameForUserId = async function(uniqueId: string, originalSize?: Boolean): Promise<string | null> {
    try
    {
        let registeredUser: UserInstance | null = await models.User.findOne({
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

const _getStartPageForUser = async function (uniqueId: string | number | undefined): Promise<string | undefined> {
    let registeredUserId: number | undefined = undefined;

    if (typeof uniqueId === 'string') {
        registeredUserId = await getUserIdForUniqueId(uniqueId);
    }
    else if (typeof uniqueId === 'number') {
        registeredUserId = uniqueId;
    }

    if (registeredUserId !== undefined) {
        let userPreferences: UserPreferencesInstance | null = await models.UserPreferences.findOne({
            attributes: [
                'startPage'
            ],
            where: {
                registeredUserId
            }
        });

        if (userPreferences) {
            return userPreferences.startPage || undefined;
        }
    }

    return undefined;
}

export const getStartPageForUser = memoize(_getStartPageForUser, {
    maxAge: ServerConstants.CACHE_DURATIONS.USER_BY_UNIQUE_ID,
    promise: true
});

const _getUniqueIdForUserId = async function(id: number): Promise<string | undefined> {
    try
    {
        let registeredUser: UserInstance | null = await models.User.findOne({
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

export const getUniqueIdForUserId = memoize(_getUniqueIdForUserId, {
    maxAge: ServerConstants.CACHE_DURATIONS.USER_BY_ID,
    promise: true
});

export const getUserDisplayName = async function(uniqueId: string): Promise<string | null> {
    try {
        let registeredUser: UserInstance | null = await getUserWithUniqueId(uniqueId);

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

export const getUserEmail = async function(uniqueId: string): Promise<string | null> {
    try
    {   
        let registeredUser: UserInstance | null = await models.User.findOne({
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

const _getUserIdForUniqueId = async function(uniqueId: string): Promise<number | undefined> {
    try
    {
        let registeredUser: UserInstance | null = await models.User.findOne({
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

export const getUserIdForUniqueId = memoize(_getUserIdForUniqueId, {
    maxAge: ServerConstants.CACHE_DURATIONS.USER_BY_UNIQUE_ID,
    promise: true
});

export const setUserDisplayName = async function(uniqueId: string, displayName: string): Promise<{success: Boolean, displayNameIndex?: number, message?: string}> {
    try
    {
        let registeredUser: UserInstance | null = await getUserWithUniqueId(uniqueId);

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
        const currentMax: number = await models.DisplayName.max('displayNameIndex', {
            where: {
                displayName
            }
        });

        const nextIndex: number = (isNaN(currentMax) ? 0 : currentMax) + 1;

        let newDisplayName: DisplayNameInstance = await models.DisplayName.create({
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

export const setUserEmail = async function(uniqueId: string, email: string): Promise<{success: Boolean, message?: string}> {
    try {
        let registeredUser: UserInstance | null = await getUserWithUniqueId(uniqueId);

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

export const updateUserPreferences = async function(uniqueId: string, preferences: Array<{ name: string, value: string | Boolean | number }>): Promise<Boolean> {
    try {
        let registeredUserId: number | undefined = await getUserIdForUniqueId(uniqueId);

        if (registeredUserId) {
            let updatedPreferences: Boolean = false;

            // Use these to accumulate the updates to be made to the two tables so we can do everything in one update
            let userUpdateAttributes: { [key: string]: string | Boolean | number } = {};
            let preferenceUpdateAttributes: { [key: string]: string | Boolean | number | null } = {};

            // Loop through all preferences that changed and populate the attributes dictionaries
            for (let preference of preferences) {
                let { name, value }: { name: string, value: string | Boolean | number } = preference;

                switch (name) {
                    case 'allowPublicAccess':
                        if (typeof value === 'boolean') {
                            userUpdateAttributes.allowPublicAccess = value;
                        }

                        break;
                    case 'customAudience':
                        if (typeof value === 'string') {
                            if (isNullOrWhiteSpaceOnly(value)) {
                                preferenceUpdateAttributes.customAudience = null;
                            }
                            else {
                                preferenceUpdateAttributes.customAudience = value;
                            }
                        }

                        break;
                    case 'feedFilter':
                        let feedFilter: number = NaN;

                        if (typeof value === 'string') {
                            feedFilter = Number(value);
                        }
                        else if (typeof value === 'number') {
                            feedFilter = value;
                        }

                        if (!isNaN(feedFilter) 
                            && Object.values(ClientConstants.POST_TYPES).findIndex(key => key === feedFilter) !== -1
                        ) {
                            preferenceUpdateAttributes.feedFilter = feedFilter;
                        }

                        break;
                    case 'mediaVolume':
                        let mediaVolume: number = NaN;

                        if (typeof value === 'string') {
                            mediaVolume = Number(value);
                        }
                        else if (typeof value === 'number') {
                            mediaVolume = value;
                        }

                        if (!isNaN(mediaVolume) && mediaVolume >= 0 && mediaVolume <= 100) {
                            preferenceUpdateAttributes.mediaVolume = mediaVolume;
                        }

                        break;
                    case 'postAudience':
                        let postAudience: number = NaN;

                        if (typeof value === 'string') {
                            postAudience = Number(value);
                        }
                        else if (typeof value === 'number') {
                            postAudience = value;
                        }

                        if (!isNaN(postAudience) 
                            && Object.values(ClientConstants.POST_AUDIENCES).findIndex(key => key === postAudience) !== -1
                        ) {
                            preferenceUpdateAttributes.postAudience = postAudience;
                        }

                        break;
                    case 'postType':
                        let postType: number = NaN;

                        if (typeof value === 'string') {
                            postType = Number(value);
                        }
                        else if (typeof value === 'number') {
                            postType = value;
                        }

                        if (!isNaN(postType) 
                            && postType !== ClientConstants.POST_TYPES.ALL 
                            && Object.values(ClientConstants.POST_TYPES).findIndex(key => key === postType) !== -1
                        ) {
                            preferenceUpdateAttributes.postType = postType;
                        }

                        break;
                    case 'showMyPostsInFeed':
                        if (typeof value === 'boolean') {
                            preferenceUpdateAttributes.showMyPostsInFeed = value;
                        }

                        break;
                    case 'startPage':
                        if (typeof value === 'string') {
                            // Future: May want to drive these choices from a table
                            if (value === 'profile' || value === 'feed') {
                                preferenceUpdateAttributes.startPage = value;

                                getStartPageForUser.delete(uniqueId);
                                getStartPageForUser.delete(registeredUserId);
                            }
                        }

                        break;
                    default:
                        break;
                }
            }

            // If the dictionaries have keys, update the tables
            if (Object.keys(userUpdateAttributes).length > 0) {
                await models.User.update(
                    userUpdateAttributes,
                    {
                        where: {
                            id: registeredUserId
                        }
                    }
                );

                updatedPreferences = true;
            }

            if (Object.keys(preferenceUpdateAttributes).length > 0) {
                await models.UserPreferences.update(
                    preferenceUpdateAttributes,
                    {
                        where: {
                            registeredUserId
                        }
                    }
                );

                updatedPreferences = true;
            }

            return updatedPreferences;
        }
    }
    catch (err) {
        console.error(`Error updating preferences for ${uniqueId}`);
    }
    return false;
}

export const verifyUserDisplayName = async function(uniqueId: string, displayName: string): Promise<{success: Boolean, message: string}> {
    try 
    {
        // Make sure the display name is not already verified
        let verifiedDisplayName: DisplayNameInstance | null = await models.DisplayName.findOne({
            where: {
                displayName,
                displayNameIndex: 0
            }
        });
       
        if (verifiedDisplayName) {
            return {success: false, message: 'That display name has already been verified.'};
        }
        else {
            verifiedDisplayName = await models.DisplayName.findOne({
                where: {
                    displayName
                },
                include: {
                    model: models.User,
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
