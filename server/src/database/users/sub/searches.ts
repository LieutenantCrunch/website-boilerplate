import memoize from 'memoizee';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize';

import * as ClientConstants from '../../../constants/constants.client';
import * as ServerConstants from '../../../constants/constants.server';
import { isNullOrWhiteSpaceOnly } from '../../../utilities/utilityFunctions';

import { models } from '../../../models/_index';
import { DisplayNameInstance } from '../../../models/DisplayName';
import { PostNotificationInstance } from '../../../models/PostNotification';
import { ProfilePictureInstance } from '../../../models/ProfilePicture';
import { UserConnectionInstance } from '../../../models/UserConnection';
import { UserConnectionTypeInstance } from '../../../models/UserConnectionType';
import { UserConnectionViewInstance } from '../../../models/views/UserConnectionView';
import { UserInstance } from '../../../models/User';
import { UserPreferencesInstance } from '../../../models/UserPreferences';

import { checkIfFirstUserIsBlockingSecond } from './blocking';
import { getConnectionTypeDict } from './connections';
import { getUserIdForUniqueId } from './fields';
import { checkUserForRole } from './roles';

export const getProfileInfo = async function(currentUniqueId: string | undefined, profileName: string, includeEmail: Boolean): Promise<WebsiteBoilerplate.UserDetails | null> {
    try {
        let currentUserId: number | undefined = await getUserIdForUniqueId(currentUniqueId || '-1');
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
                    model: models.DisplayName,
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
                    model: models.ProfilePicture,
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
            connectionTypes = await getConnectionTypeDict();
            
            queryOptions.include.push({
                model: models.UserConnection,
                as: 'incomingConnections',
                required: false,
                where: {
                    requestedUserId: currentUserId
                },
                include: [
                    {
                        model: models.UserConnectionType,
                        as: 'connectionTypes',
                        required: false
                    }
                ]
            },
            {
                model: models.User,
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

        let registeredUser: UserInstance | null = await models.User.findOne(queryOptions);

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
                    pfp: profilePicture ? `${ClientConstants.PUBLIC_USER_PATH}${registeredUser.uniqueId}/${profilePicture.fileName}` : `${ClientConstants.STATIC_IMAGE_PATH}pfpDefault.svgz`,
                    pfpSmall: profilePicture ? `${ClientConstants.PUBLIC_USER_PATH}${registeredUser.uniqueId}/${profilePicture.smallFileName}` : `${ClientConstants.STATIC_IMAGE_PATH}pfpDefault.svgz`,
                    profileName,
                    uniqueId: registeredUser.uniqueId
                };
            }
            else {
                if (await checkIfFirstUserIsBlockingSecond(registeredUser.id!, currentUserId!)) {
                    return null;
                }

                let connectionViewRecord: UserConnectionViewInstance | null = await models.Views.UserConnectionView.findOne({
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
                    allowPublicAccess: Boolean(registeredUser.allowPublicAccess),
                    connectedToCurrentUser: (registeredUser.incomingConnections !== undefined && registeredUser.incomingConnections.length > 0),
                    connectionTypes: {
                        ...connectionTypes,
                        ...userConnectionTypes
                    },
                    displayName: displayName ? displayName.displayName : '',
                    displayNameIndex: displayName ? displayName.displayNameIndex : -1,
                    isBlocked,
                    isMutual,
                    pfp: profilePicture ? `${ClientConstants.PUBLIC_USER_PATH}${registeredUser.uniqueId}/${profilePicture.fileName}` : `${ClientConstants.STATIC_IMAGE_PATH}pfpDefault.svgz`,
                    pfpSmall: profilePicture ? `${ClientConstants.PUBLIC_USER_PATH}${registeredUser.uniqueId}/${profilePicture.smallFileName}` : `${ClientConstants.STATIC_IMAGE_PATH}pfpDefault.svgz`,
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

export const getUserDetails = async function(currentUniqueId: string | undefined, uniqueId: string, includeEmail: Boolean): Promise<WebsiteBoilerplate.UserDetails | null> {
    try {
        let currentUniqueIdExists: Boolean = !isNullOrWhiteSpaceOnly(currentUniqueId);
        let userIsCurrent: Boolean = currentUniqueIdExists && currentUniqueId === uniqueId;
        let getConnectionTypes: Boolean = currentUniqueIdExists && currentUniqueId !== uniqueId;
        let currentUser: UserInstance | null = null;
        
        if (currentUniqueId) {
            if (await checkIfFirstUserIsBlockingSecond(uniqueId, currentUniqueId)) {
                return null;
            }

            currentUser = await getUserWithUniqueId(currentUniqueId);
        }

        let registeredUser: UserInstance | null = await models.User.findOne({
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
                    model: models.DisplayName,
                    as: 'displayNames',
                    attributes: [
                        'displayName',
                        'displayNameIndex'
                    ],
                    where: {
                        isActive: true
                    }
                }, 
                {
                    model: models.ProfilePicture,
                    as: 'profilePictures',
                    attributes: [
                        'fileName',
                        'smallFileName'
                    ],
                    on: {
                        id: {
                            [Op.eq]: Sequelize.literal('(select `id` FROM `profile_picture` where `profile_picture`.`registered_user_id` = `User`.`id` order by `profile_picture`.`id` desc limit 1)')
                        }
                    }
                },
                {
                    model: models.Role,
                    as: 'roles',
                    attributes: [
                        'roleName'
                    ]
                }
            ],
            subQuery: false // See notes elsewhere
        });

        if (registeredUser) {
            let isMutual: Boolean = false;

            if (currentUser) {
                let connectionViewRecord: UserConnectionViewInstance | null = await models.Views.UserConnectionView.findOne({
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
                allowPublicAccess: Boolean(registeredUser.allowPublicAccess),
                displayName: (registeredUser.displayNames && registeredUser.displayNames[0] ? registeredUser.displayNames[0].displayName : ''),
                displayNameIndex: (registeredUser.displayNames && registeredUser.displayNames[0] ? registeredUser.displayNames[0].displayNameIndex : -1),
                isBlocked: false, /* Handled below */
                isMutual,
                pfp: (registeredUser.profilePictures && registeredUser.profilePictures[0] ? `${ClientConstants.PUBLIC_USER_PATH}${uniqueId}/${registeredUser.profilePictures[0].fileName}` : `${ClientConstants.STATIC_IMAGE_PATH}pfpDefault.svgz`),
                pfpSmall: (registeredUser.profilePictures && registeredUser.profilePictures[0] ? `${ClientConstants.PUBLIC_USER_PATH}${uniqueId}/${registeredUser.profilePictures[0].smallFileName}` : `${ClientConstants.STATIC_IMAGE_PATH}pfpDefault.svgz`),
                profileName: registeredUser.profileName,
                roles: (registeredUser.roles ? registeredUser.roles.map(role => role.roleName) : []),
                uniqueId
            };

            if (userIsCurrent) {
                let unseenPostNotifications: PostNotificationInstance[] = await models.PostNotification.findAll({
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

                userDetails.hasUnseenPostNotifications = unseenPostNotifications.length > 0;

                let userPreferences: UserPreferencesInstance = await registeredUser.getUserPreferences();

                if (userPreferences) {
                    userDetails.preferences = {
                        customAudience: userPreferences.customAudience || undefined,
                        feedFilter: userPreferences.feedFilter!,
                        mediaVolume: userPreferences.mediaVolume!,
                        postAudience: userPreferences.postAudience!,
                        postType: userPreferences.postType!,
                        showMyPostsInFeed: Boolean(userPreferences.showMyPostsInFeed!),
                        startPage: userPreferences.startPage || undefined
                    };
                }
                else {
                    // ## Temporary during dev. All new users should have them
                    console.warn(`User ${uniqueId} does not have a preferences record, creating one`);

                    try {
                        let testPrefs: UserPreferencesInstance = await models.UserPreferences.create({
                            registeredUserId: registeredUser.id!
                        });

                        if (testPrefs) {
                            userDetails.preferences = {
                                customAudience: testPrefs.customAudience || undefined,
                                feedFilter: testPrefs.feedFilter!,
                                mediaVolume: testPrefs.mediaVolume!,
                                postAudience: testPrefs.postAudience!,
                                postType: testPrefs.postType!,
                                showMyPostsInFeed: Boolean(testPrefs.showMyPostsInFeed!),
                                startPage: testPrefs.startPage || undefined
                            };
                        }
                    }
                    catch (e) {
                        console.error(e.message);
                    }
                }
            }

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
                            model: models.UserConnectionType,
                            as: 'connectionTypes'
                        }
                    });

                    let allConnectionTypes: WebsiteBoilerplate.UserConnectionTypeDictionary = await getConnectionTypeDict();

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

const _getUserWithId = async function(id: number): Promise<UserInstance | null> {
    try
    {
        let registeredUser: UserInstance | null = await models.User.findOne({
            where: {
                id
            },
            include: [
                {
                    model: models.DisplayName,
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
                    model: models.ProfilePicture,
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

export const getUserWithId = memoize(_getUserWithId, {
    maxAge: ServerConstants.CACHE_DURATIONS.USER_BY_ID,
    promise: true
});

const _getUserWithProfileName = async function(profileName: string): Promise<UserInstance | null> {
    try
    {
        let registeredUser: UserInstance | null = await models.User.findOne({
            where: {
                profileName
            },
            include: [
                {
                    model: models.DisplayName,
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
                    model: models.ProfilePicture,
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

export const getUserWithProfileName = memoize(_getUserWithProfileName, {
    maxAge: ServerConstants.CACHE_DURATIONS.USER_BY_PROFILE_NAME,
    promise: true
});

const _getUserWithUniqueId = async function(uniqueId: string): Promise<UserInstance | null> {
    try
    {
        let registeredUser: UserInstance | null = await models.User.findOne({
            where: {
                uniqueId
            },
            include: [
                {
                    model: models.DisplayName,
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
                    model: models.ProfilePicture,
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

export const getUserWithUniqueId = memoize(_getUserWithUniqueId, {
    maxAge: ServerConstants.CACHE_DURATIONS.USER_BY_UNIQUE_ID,
    promise: true
});

export const searchUsers = async function(currentUserUniqueId: string, displayNameFilter: string, displayNameIndexFilter: number, pageNumber: number, excludeConnections: Boolean): Promise<WebsiteBoilerplate.UserSearchResults | null> {
    try {
        let currentUser: UserInstance | null = await getUserWithUniqueId(currentUserUniqueId);

        if (currentUser) {
            let currentUserId: number = currentUser.id!;

            let isAdministrator: Boolean = await checkUserForRole(currentUserUniqueId, 'Administrator');

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
                        model: models.User,
                        as: 'registeredUser',
                        required: true,
                        attributes: [
                            'uniqueId',
                            'profileName'
                        ],
                        include: [
                            {
                                model: models.ProfilePicture,
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
                                model: models.User,
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
            connectionViewRecords = await models.Views.UserConnectionView.findAll({
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
                        model: models.UserConnection,
                        as: 'outgoingConnections',
                        attributes: [],
                        required: false
                    },
                    {
                        model: models.UserConnection,
                        as: 'incomingConnections',
                        attributes: [],
                        required: false,
                        include: [
                            {
                                model: models.User,
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

            let {rows, count}: {rows: DisplayNameInstance[]; count: number} = await models.DisplayName.findAndCountAll(queryOptions);

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
                        pfp: (displayName.registeredUser!.profilePictures && displayName.registeredUser!.profilePictures[0] ? `${ClientConstants.PUBLIC_USER_PATH}${displayName.registeredUser!.uniqueId}/${displayName.registeredUser!.profilePictures[0].fileName}` : `${ClientConstants.STATIC_IMAGE_PATH}pfpDefault.svgz`),
                        pfpSmall: (displayName.registeredUser!.profilePictures && displayName.registeredUser!.profilePictures[0] ? `${ClientConstants.PUBLIC_USER_PATH}${displayName.registeredUser!.uniqueId}/${displayName.registeredUser!.profilePictures[0].smallFileName}` : `${ClientConstants.STATIC_IMAGE_PATH}pfpDefault.svgz`),
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

export const userExistsForEmail = async function(email: string): Promise<Boolean> {
    try
    {
        let registeredUser: UserInstance | null = await models.User.findOne({
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

export const userExistsForProfileName = async function(currentUserUniqueId: string | undefined, profileName: string): Promise<{exists: Boolean, allowPublicAccess: Boolean}> {
    try
    {
        let registeredUser: UserInstance | null = await getUserWithProfileName(profileName);

        if (registeredUser) {
            let exists: Boolean = true;

            if (currentUserUniqueId) {
                exists = !(await checkIfFirstUserIsBlockingSecond(registeredUser.id!, currentUserUniqueId));
            }

            return {exists, allowPublicAccess: Boolean(registeredUser.allowPublicAccess)};
        }
    }
    catch (err)
    {
        console.error(`Error looking up user with profile name ${profileName}:\n${err.message}`);
    }

    return {exists: false, allowPublicAccess: false};
}
