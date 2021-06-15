import { Op } from 'sequelize';
import NodeCache from 'node-cache';

import * as ClientConstants from '../../../constants/constants.client';
import * as ServerConstants from '../../../constants/constants.server';

import { models } from '../../../models/_index';
import { UserConnectionInstance } from '../../../models/UserConnection';
import { UserConnectionTypeInstance } from '../../../models/UserConnectionType';
import { UserConnectionViewInstance } from '../../../models/views/UserConnectionView';
import { UserInstance } from '../../../models/User';

import { getUserIdForUniqueId } from './fields';
import { checkUserForRole } from './roles';
import { getUserWithUniqueId } from './searches';

const nodeCache: NodeCache = new NodeCache();

export const getConnectionTypeDict = async function(): Promise<WebsiteBoilerplate.UserConnectionTypeDictionary> {
    try {
        let connectionTypesDict: WebsiteBoilerplate.UserConnectionTypeDictionary | undefined = nodeCache.get(ServerConstants.CACHE_KEY_CONNECTION_TYPES_DICT);

        if (!connectionTypesDict) {
            let connectionTypes: UserConnectionTypeInstance[] = await getConnectionTypes();

            connectionTypesDict = connectionTypes.reduce((previousValue, currentValue) => {
                return {
                    ...previousValue,
                    [currentValue.displayName]: false
                }
            }, {});

            nodeCache.set(ServerConstants.CACHE_KEY_CONNECTION_TYPES_DICT, connectionTypesDict, ServerConstants.CACHE_DURATIONS.CONNECTION_TYPES);
        }

        return connectionTypesDict;
    }
    catch (err) {
        console.error(`Error looking up connection types:\n${err.message}`);
    }

    return {};
}

export const getConnectionTypes = async function(): Promise<UserConnectionTypeInstance[]> {
    try {
        let userConnectionTypes: UserConnectionTypeInstance[] | null = await models.UserConnectionType.findAll();

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

export const getIncomingConnections = async function(uniqueId: string, specificConnectionId?: string): Promise<WebsiteBoilerplate.UserDetails[]> {
    try {
        let connectionTypes: WebsiteBoilerplate.UserConnectionTypeDictionary = await getConnectionTypeDict();

        let registeredUserId: number | undefined = await getUserIdForUniqueId(uniqueId);

        if (registeredUserId !== undefined) {
            let incomingConnectionsView: UserConnectionViewInstance[] | null = await models.Views.UserConnectionView.findAll({
                where: {
                    connectedUserId: registeredUserId
                },
                attributes: [
                    'isMutual'
                ],
                include: [
                    {
                        model: models.UserConnection,
                        as: 'userConnection',
                        required: true,
                        include: [
                            {
                                model: models.User,
                                as: 'requestedUser',
                                attributes: [
                                    'allowPublicAccess',
                                    'uniqueId',
                                    'profileName'
                                ],
                                required: true,
                                include: [
                                    {
                                        model: models.DisplayName,
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
                                        model: models.ProfilePicture,
                                        as: 'profilePictures',
                                        attributes: [
                                            'fileName',
                                            'smallFileName'
                                        ],
                                        order: [['id', 'DESC']],
                                        required: false
                                    },
                                    {
                                        model: models.User,
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
                                model: models.UserConnectionType,
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
                        model: models.UserConnection,
                        as: 'mutualConnection',
                        required: false,
                        include: [
                            {
                                model: models.UserConnectionType,
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

                        let requestedUserUniqueId: string = requestedUser.uniqueId;

                        results.push({
                            allowPublicAccess: Boolean(requestedUser.allowPublicAccess),
                            connectedToCurrentUser: false, /* This list will only contain users who are not connected */
                            connectionTypes: {...connectionTypes},    
                            displayName: (requestedUser.displayNames && requestedUser.displayNames[0] ? requestedUser.displayNames[0].displayName : ''),
                            displayNameIndex: (requestedUser.displayNames && requestedUser.displayNames[0] ? requestedUser.displayNames[0].displayNameIndex : -1),
                            isBlocked,
                            isMutual: false, /* Incoming connections will never be mutual */
                            pfp: (requestedUser.profilePictures && requestedUser.profilePictures[0] ? `${ClientConstants.PUBLIC_USER_PATH}${requestedUserUniqueId}/${requestedUser.profilePictures[0].fileName}` : `${ClientConstants.STATIC_IMAGE_PATH}pfpDefault.svgz`),
                            pfpSmall: (requestedUser.profilePictures && requestedUser.profilePictures[0] ? `${ClientConstants.PUBLIC_USER_PATH}${requestedUserUniqueId}/${requestedUser.profilePictures[0].smallFileName}` : `${ClientConstants.STATIC_IMAGE_PATH}pfpDefault.svgz`),
                            profileName: requestedUser.profileName,
                            uniqueId: requestedUserUniqueId
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

export const getOutgoingConnections = async function(uniqueId: string, specificConnectionId?: string): Promise<WebsiteBoilerplate.UserDetails[]> {
    try {
        let connectionTypes: WebsiteBoilerplate.UserConnectionTypeDictionary = await getConnectionTypeDict();

        let registeredUserId: number | undefined = await getUserIdForUniqueId(uniqueId);

        if (registeredUserId !== undefined) {
            let isAdministrator: Boolean = await checkUserForRole(registeredUserId, 'Administrator');

            let queryOptions: {[key: string]: any;} = {};

            let userConnectionIncludes: {[key: string]: any;}[] = [
                {
                    model: models.User,
                    as: 'connectedUser',
                    attributes: [
                        'allowPublicAccess',
                        'uniqueId',
                        'profileName'
                    ],
                    required: true,
                    include: [
                        {
                            model: models.DisplayName,
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
                            model: models.ProfilePicture,
                            as: 'profilePictures',
                            attributes: [
                                'fileName',
                                'smallFileName'
                            ],
                            order: [['id', 'DESC']],
                            required: false
                        }
                    ]
                },
                {
                    model: models.UserConnectionType,
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
                    model: models.UserBlock,
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
                        model: models.UserConnection,
                        as: 'userConnection',
                        required: true,
                        include: userConnectionIncludes
                    }
                ]
            };

            let outgoingConnectionsView: UserConnectionViewInstance[] | null = await models.Views.UserConnectionView.findAll(queryOptions);

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

                    let connectedUserUniqueId: string = connectedUser.uniqueId;

                    return {
                        allowPublicAccess: Boolean(connectedUser.allowPublicAccess),
                        connectedToCurrentUser: true, /* Outgoing connections are always connected to the user */
                        connectionTypes: {...connectionTypes, ...userConnectionTypes},
                        displayName: (connectedUser.displayNames && connectedUser.displayNames[0] ? connectedUser.displayNames[0].displayName : ''),
                        displayNameIndex: (connectedUser.displayNames && connectedUser.displayNames[0] ? connectedUser.displayNames[0].displayNameIndex : -1),
                        isBlocked: false, /* Outgoing connections shouldn't be blocked */
                        isMutual: connectionView.isMutual,
                        pfp: (connectedUser.profilePictures && connectedUser.profilePictures[0] ? `${ClientConstants.PUBLIC_USER_PATH}${connectedUserUniqueId}/${connectedUser.profilePictures[0].fileName}` : `${ClientConstants.STATIC_IMAGE_PATH}pfpDefault.svgz`),
                        pfpSmall: (connectedUser.profilePictures && connectedUser.profilePictures[0] ? `${ClientConstants.PUBLIC_USER_PATH}${connectedUserUniqueId}/${connectedUser.profilePictures[0].smallFileName}` : `${ClientConstants.STATIC_IMAGE_PATH}pfpDefault.svgz`),
                        profileName: connectedUser.profileName,
                        uniqueId: connectedUserUniqueId
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

export const removeUserConnection = async function(currentUserUniqueId: string, connectedUserUniqueId: string): Promise<WebsiteBoilerplate.RemoveUserConnectionResults> {
    try
    {
        let currentUser: UserInstance | null = await getUserWithUniqueId(currentUserUniqueId);
        let connectedUser: UserInstance | null = await getUserWithUniqueId(connectedUserUniqueId);

        if (currentUser && connectedUser) {
            let userConnection: UserConnectionInstance | null = await models.UserConnection.findOne({
                where: {
                    requestedUserId: currentUser.id!,
                    connectedUserId: connectedUser.id!
                }
            });
            
            let wasMutual: Boolean = false;

            if (userConnection) {
                let userConnectionView: UserConnectionViewInstance | null = await models.Views.UserConnectionView.findOne({
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

export const updateUserConnection = async function(currentUserUniqueId: string, connectionUpdates: WebsiteBoilerplate.UserDetails): Promise<WebsiteBoilerplate.UpdateUserConnectionResults> {
    let results: WebsiteBoilerplate.UpdateUserConnectionResults = {
        actionTaken: ClientConstants.UPDATE_USER_CONNECTION_ACTIONS.NONE,
        success: false,
        userConnection: connectionUpdates
    };

    try
    {
        let connectedUserUniqueId: string = connectionUpdates.uniqueId;
        let connectedUser: UserInstance | null = await getUserWithUniqueId(connectedUserUniqueId);

        if (connectedUser) {
            let currentUser: UserInstance | null = await models.User.findOne({
                where: {
                    uniqueId: currentUserUniqueId
                },
                include: [
                    {
                        model: models.UserConnection,
                        as: 'outgoingConnections',
                        required: false,
                        where: {
                            connectedUserId: connectedUser.id!
                        },
                        include: [
                            {
                                model: models.UserConnectionType,
                                as: 'connectionTypes',
                                required: false
                            },
                            {
                                model: models.User,
                                as: 'connectedUser',
                                required: false,
                                include: [
                                    {
                                        model: models.User,
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
                let allConnectionTypes: UserConnectionTypeInstance[] = await getConnectionTypes();
                let connectionTypes: WebsiteBoilerplate.UserConnectionTypeDictionary = connectionUpdates.connectionTypes!;

                let incomingConnection: UserConnectionInstance | null = await models.UserConnection.findOne({
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
                            allowPublicAccess: Boolean(connectedUser.allowPublicAccess),
                            connectedToCurrentUser: true, /* If we updated the connection, it means that they're connected to the user */
                            connectionTypes,
                            displayName: (connectedUser.displayNames && connectedUser.displayNames[0] ? connectedUser.displayNames[0].displayName : ''),
                            displayNameIndex: (connectedUser.displayNames && connectedUser.displayNames[0] ? connectedUser.displayNames[0].displayNameIndex : -1),
                            pfp: (connectedUser.profilePictures && connectedUser.profilePictures[0] ? `${ClientConstants.PUBLIC_USER_PATH}${connectedUserUniqueId}/${connectedUser.profilePictures[0].fileName}` : `${ClientConstants.STATIC_IMAGE_PATH}pfpDefault.svgz`),
                            pfpSmall: (connectedUser.profilePictures && connectedUser.profilePictures[0] ? `${ClientConstants.PUBLIC_USER_PATH}${connectedUserUniqueId}/${connectedUser.profilePictures[0].smallFileName}` : `${ClientConstants.STATIC_IMAGE_PATH}pfpDefault.svgz`),
                            isBlocked: false, /* Outgoing connections shouldn't be blocked */
                            isMutual: incomingConnection !== null,
                            profileName: connectedUser.profileName,
                            uniqueId: connectedUserUniqueId
                        }
                    };

                    return results;
                }
                else { // Else, this is a new connection
                    let newConnection: UserConnectionInstance = await models.UserConnection.create({
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
                            allowPublicAccess: Boolean(connectedUser.allowPublicAccess),
                            connectedToCurrentUser: true, /* They are now connected to the current user */
                            connectionTypes,
                            displayName: (connectedUser.displayNames && connectedUser.displayNames[0] ? connectedUser.displayNames[0].displayName : ''),
                            displayNameIndex: (connectedUser.displayNames && connectedUser.displayNames[0] ? connectedUser.displayNames[0].displayNameIndex : -1),
                            pfp: (connectedUser.profilePictures && connectedUser.profilePictures[0] ? `${ClientConstants.PUBLIC_USER_PATH}${connectedUserUniqueId}/${connectedUser.profilePictures[0].fileName}` : `${ClientConstants.STATIC_IMAGE_PATH}pfpDefault.svgz`),
                            pfpSmall: (connectedUser.profilePictures && connectedUser.profilePictures[0] ? `${ClientConstants.PUBLIC_USER_PATH}${connectedUserUniqueId}/${connectedUser.profilePictures[0].smallFileName}` : `${ClientConstants.STATIC_IMAGE_PATH}pfpDefault.svgz`),
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
