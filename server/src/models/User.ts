import { DataTypes, Model, ModelCtor, Optional, Sequelize, HasManyGetAssociationsMixin, HasManyAddAssociationMixin, HasManyRemoveAssociationMixin, BelongsToManyGetAssociationsMixin, BelongsToManyAddAssociationMixin, BelongsToManyAddAssociationsMixin, BelongsToManyRemoveAssociationMixin, BelongsToManyRemoveAssociationsMixin, HasManyCreateAssociationMixin, HasManyRemoveAssociationsMixin, HasManyAddAssociationsMixin, BelongsToManyHasAssociationMixin, HasOneGetAssociationMixin } from 'sequelize';
import { SequelizeAttributes } from '../typings/SequelizeAttributes';
import { DisplayNameInstance } from './DisplayName';
import { PasswordResetTokenInstance } from './PasswordResetToken';
import { PostInstance } from './Post';
import { PostFileInstance } from './PostFile';
import { PostNotificationInstance } from './PostNotification';
import { ProfilePictureInstance } from './ProfilePicture';
import { RoleInstance } from './Role';
import { UserConnectionInstance } from './UserConnection';
import { UserJWTInstance } from './UserJWT';
import { UserPreferencesInstance } from './UserPreferences';

export interface UserAttributes {
    id?: number;
    email: string;
    passwordHash: string;
    uniqueId: string;
    profileName: string;
    allowPublicAccess?: Boolean;
    activeJWTs?: UserJWTInstance[];
    blockedUsers?: UserInstance[];
    blockingUsers?: UserInstance[];
    displayNames?: DisplayNameInstance[];
    inactiveJWTs?: UserJWTInstance[];
    incomingConnections?: UserConnectionInstance[];
    outgoingConnections?: UserConnectionInstance[];
    passwordResetTokens?: PasswordResetTokenInstance[];
    posts?: PostInstance[];
    postFiles?: PostFileInstance[];
    postNotifications?: PostNotificationInstance[];
    profilePictures?: ProfilePictureInstance[];
    roles?: RoleInstance[];
    userPreferences?: UserPreferencesInstance;
    triggeredPostNotifications?: PostNotificationInstance[];
};

export interface UserCreationAttributes extends Optional<UserAttributes, 'id'>, 
    Optional<UserAttributes, 'allowPublicAccess'> {};

export interface UserInstance extends Model<UserAttributes, UserCreationAttributes>, UserAttributes {
    getActiveJWTs: HasManyGetAssociationsMixin<UserJWTInstance>;
    addActiveJWT: HasManyAddAssociationMixin<UserJWTInstance, UserJWTInstance['id']>;
    addActiveJWTs: HasManyAddAssociationsMixin<UserJWTInstance, UserJWTInstance['id']>;
    createActiveJWT: HasManyCreateAssociationMixin<UserJWTInstance>;
    removeActiveJWT: HasManyRemoveAssociationMixin<UserJWTInstance, UserJWTInstance['id']>;
    removeActiveJWTs: HasManyRemoveAssociationsMixin<UserJWTInstance, UserJWTInstance['id']>;

    getBlockedUsers: BelongsToManyGetAssociationsMixin<UserInstance>;
    addBlockedUser: BelongsToManyAddAssociationMixin<UserInstance, UserInstance['id']>;
    removeBlockedUser: BelongsToManyRemoveAssociationMixin<UserInstance, UserInstance['id']>;

    getBlockingUsers: BelongsToManyGetAssociationsMixin<UserInstance>;

    getDisplayNames: HasManyGetAssociationsMixin<DisplayNameInstance>;
    addDisplayName: HasManyAddAssociationMixin<DisplayNameInstance, DisplayNameInstance['id']>;

    getInactiveJWTs: HasManyGetAssociationsMixin<UserJWTInstance>;
    addInactiveJWT: HasManyAddAssociationMixin<UserJWTInstance, UserJWTInstance['id']>;
    addInactiveJWTs: HasManyAddAssociationsMixin<UserJWTInstance, UserJWTInstance['id']>;

    getIncomingConnections: HasManyGetAssociationsMixin<UserConnectionInstance>;
    addIncomingConnection: HasManyAddAssociationMixin<UserConnectionInstance, UserConnectionInstance['id']>;

    getOutgoingConnections: HasManyGetAssociationsMixin<UserConnectionInstance>;
    addOutgoingConnection: HasManyAddAssociationMixin<UserConnectionInstance, UserConnectionInstance['id']>;

    getPasswordResetTokens: HasManyGetAssociationsMixin<PasswordResetTokenInstance>;
    addPasswordResetToken: HasManyAddAssociationMixin<PasswordResetTokenInstance, PasswordResetTokenInstance['id']>;
    createPasswordResetToken: HasManyCreateAssociationMixin<PasswordResetTokenInstance>;

    getPosts: HasManyGetAssociationsMixin<PostInstance>;
    
    getPostFiles: HasManyGetAssociationsMixin<PostFileInstance>;

    addPostNotification: HasManyAddAssociationMixin<PostNotificationInstance, PostNotificationInstance['id']>;
    getPostNotifications: HasManyGetAssociationsMixin<PostNotificationInstance>;
    removePostNotification: HasManyRemoveAssociationMixin<PostNotificationInstance, PostNotificationInstance['id']>;
    removePostNotifications: HasManyRemoveAssociationsMixin<PostNotificationInstance, PostNotificationInstance['id']>;

    getProfilePictures: HasManyGetAssociationsMixin<ProfilePictureInstance>;
    addProfilePicture: HasManyAddAssociationMixin<ProfilePictureInstance, ProfilePictureInstance['id']>;
    createProfilePicture: HasManyCreateAssociationMixin<ProfilePictureInstance>;

    getRoles: BelongsToManyGetAssociationsMixin<RoleInstance>;
    hasRole: BelongsToManyHasAssociationMixin<RoleInstance, RoleInstance['id']>;
    addRole: BelongsToManyAddAssociationMixin<RoleInstance, RoleInstance['id']>;
    addRoles: BelongsToManyAddAssociationsMixin<RoleInstance, RoleInstance['id']>;
    removeRole: BelongsToManyRemoveAssociationMixin<RoleInstance, RoleInstance['id']>;
    removeRoles: BelongsToManyRemoveAssociationsMixin<RoleInstance, RoleInstance['id']>;

    getUserPreferences: HasOneGetAssociationMixin<UserPreferencesInstance>;

    addTriggeredPostNotification: HasManyAddAssociationMixin<PostNotificationInstance, PostNotificationInstance['id']>;
    getTriggeredPostNotifications: HasManyGetAssociationsMixin<PostNotificationInstance>;
    removeTriggeredPostNotification: HasManyRemoveAssociationMixin<PostNotificationInstance, PostNotificationInstance['id']>;
};

export const UserFactory = (sequelize: Sequelize): ModelCtor<UserInstance> => {
    const attributes: SequelizeAttributes<UserAttributes> = {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        email: {
            type: DataTypes.STRING(100),
            unique: true
        },
        passwordHash: {
            type: DataTypes.STRING(500),
            field: 'password_hash'
        },
        uniqueId: {
            type: DataTypes.UUIDV4,
            field: 'unique_id',
            unique: true
        },
        profileName: {
            type: DataTypes.STRING(20),
            field: 'profile_name',
            unique: true
        },
        allowPublicAccess: {
            type: DataTypes.TINYINT,
            field: 'allow_public_access',
            defaultValue: 0
        }
    };

    const User = sequelize.define<UserInstance, UserAttributes>('User', attributes, {
        tableName: 'registered_user'
    });

    // @ts-ignore
    User.associate = (models: {[key: string]: ModelCtor<Model<any, any>>}): void => {
        User.hasMany(models.UserJWT, {
            as: 'activeJWTs',
            foreignKey: {
                name: 'registeredUserId',
                field: 'registered_user_id'
            }
        });

        User.belongsToMany(models.User, {
            as: 'blockedUsers',
            through: models.UserBlock,
            foreignKey: {
                name: 'registeredUserId',
                field: 'registered_user_id'
            }
        });

        User.belongsToMany(models.User, {
            as: 'blockingUsers',
            through: models.UserBlock,
            foreignKey: {
                name: 'blockedUserId',
                field: 'blocked_user_id'
            }
        });

        User.hasMany(models.DisplayName, {
            as: 'displayNames',
            foreignKey: {
                name: 'registeredUserId',
                field: 'registered_user_id'
            }
        });

        User.hasMany(models.UserJWT, {
            as: 'inactiveJWTs',
            foreignKey: {
                name: 'formerRegisteredUserId',
                field: 'former_registered_user_id'
            }
        });
        
        User.hasMany(models.UserConnection, {
            as: 'incomingConnections',
            foreignKey: {
                name: 'connectedUserId',
                field: 'connected_user_id'
            }
        });

        User.hasMany(models.UserConnection, {
            as: 'outgoingConnections',
            foreignKey: {
                name: 'requestedUserId',
                field: 'requested_user_id'
            }
        });
        
        User.hasMany(models.PasswordResetToken, {
            as: 'passwordResetTokens',
            foreignKey: {
                name: 'registeredUserId',
                field: 'registered_user_id'
            }
        });

        User.hasMany(models.Post, {
            as: 'posts',
            foreignKey: {
                name: 'registeredUserId',
                field: 'registered_user_id'
            }
        });

        User.hasMany(models.PostFile, {
            as: 'postFiles',
            foreignKey: {
                name: 'registeredUserId',
                field: 'registered_user_id'
            }
        });

        User.hasMany(models.PostNotification, {
            as: 'postNotifications',
            foreignKey: {
                name: 'registeredUserId',
                field: 'registered_user_id'
            }
        });

        User.hasMany(models.ProfilePicture, {
            as: 'profilePictures',
            foreignKey: {
                name: 'registeredUserId',
                field: 'registered_user_id'
            }
        });
        
        User.belongsToMany(models.Role, {
            as: 'roles',
            through: models.UserRoleJunction,
            foreignKey: {
                name: 'registeredUserId',
                field: 'registered_user_id'
            }
        });

        User.hasOne(models.UserPreferences, {
            as: 'userPreferences',
            foreignKey: {
                name: 'registeredUserId',
                field: 'registered_user_id'
            }
        });

        User.hasMany(models.PostNotification, {
            as: 'triggeredPostNotifications',
            foreignKey: {
                name: 'triggeredByUserId',
                field: 'triggered_by_user_id'
            }
        });
    };

    return User;
};
