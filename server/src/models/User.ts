import { DataTypes, Model, ModelCtor, Optional, Sequelize, HasManyGetAssociationsMixin, HasManyAddAssociationMixin, HasManyRemoveAssociationMixin, BelongsToManyGetAssociationsMixin, BelongsToManyAddAssociationMixin, BelongsToManyAddAssociationsMixin, BelongsToManyRemoveAssociationMixin, BelongsToManyRemoveAssociationsMixin, HasManyCreateAssociationMixin, HasManyRemoveAssociationsMixin, HasManyAddAssociationsMixin } from 'sequelize';
import { SequelizeAttributes } from '../typings/SequelizeAttributes';
import { DisplayNameInstance } from './DisplayName';
import { PasswordResetTokenInstance } from './PasswordResetToken';
import { ProfilePictureInstance } from './ProfilePicture';
import { RoleInstance } from './Role';
import { UserConnectionInstance } from './UserConnection';
import { UserJWTInstance } from './UserJWT';

export interface UserAttributes {
    id?: number;
    email: string;
    passwordHash: string;
    uniqueId: string;
    profileName: string;
    profilePictures?: ProfilePictureInstance[];
    activeJWTs?: UserJWTInstance[];
    inactiveJWTs?: UserJWTInstance[];
    passwordResetTokens?: PasswordResetTokenInstance[];
    displayNames?: DisplayNameInstance[];
    roles?: RoleInstance[];
    outgoingConnections?: UserConnectionInstance[];
    incomingConnections?: UserConnectionInstance[];
};

export interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {};

export interface UserInstance extends Model<UserAttributes, UserCreationAttributes>, UserAttributes {
    getProfilePictures: HasManyGetAssociationsMixin<ProfilePictureInstance>;
    addProfilePicture: HasManyAddAssociationMixin<ProfilePictureInstance, ProfilePictureInstance['id']>;
    createProfilePicture: HasManyCreateAssociationMixin<ProfilePictureInstance>;

    getActiveJWTs: HasManyGetAssociationsMixin<UserJWTInstance>;
    addActiveJWT: HasManyAddAssociationMixin<UserJWTInstance, UserJWTInstance['id']>;
    addActiveJWTs: HasManyAddAssociationsMixin<UserJWTInstance, UserJWTInstance['id']>;
    createActiveJWT: HasManyCreateAssociationMixin<UserJWTInstance>;
    removeActiveJWT: HasManyRemoveAssociationMixin<UserJWTInstance, UserJWTInstance['id']>;
    removeActiveJWTs: HasManyRemoveAssociationsMixin<UserJWTInstance, UserJWTInstance['id']>;

    getInactiveJWTs: HasManyGetAssociationsMixin<UserJWTInstance>;
    addInactiveJWT: HasManyAddAssociationMixin<UserJWTInstance, UserJWTInstance['id']>;
    addInactiveJWTs: HasManyAddAssociationsMixin<UserJWTInstance, UserJWTInstance['id']>;

    getPasswordResetTokens: HasManyGetAssociationsMixin<PasswordResetTokenInstance>;
    addPasswordResetToken: HasManyAddAssociationMixin<PasswordResetTokenInstance, PasswordResetTokenInstance['id']>;
    createPasswordResetToken: HasManyCreateAssociationMixin<PasswordResetTokenInstance>;

    getDisplayNames: HasManyGetAssociationsMixin<DisplayNameInstance>;
    addDisplayName: HasManyAddAssociationMixin<DisplayNameInstance, DisplayNameInstance['id']>;

    getRoles: BelongsToManyGetAssociationsMixin<RoleInstance>;
    addRole: BelongsToManyAddAssociationMixin<RoleInstance, RoleInstance['id']>;
    addRoles: BelongsToManyAddAssociationsMixin<RoleInstance, RoleInstance['id']>;
    removeRole: BelongsToManyRemoveAssociationMixin<RoleInstance, RoleInstance['id']>;
    removeRoles: BelongsToManyRemoveAssociationsMixin<RoleInstance, RoleInstance['id']>;

    getOutgoingConnections: HasManyGetAssociationsMixin<UserConnectionInstance>;
    addOutgoingConnection: HasManyAddAssociationMixin<UserConnectionInstance, UserConnectionInstance['id']>;

    getIncomingConnections: HasManyGetAssociationsMixin<UserConnectionInstance>;
    addIncomingConnection: HasManyAddAssociationMixin<UserConnectionInstance, UserConnectionInstance['id']>;
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
        }
    };

    const User = sequelize.define<UserInstance, UserAttributes>('User', attributes, {
        tableName: 'registered_user'
    });

    // @ts-ignore
    User.associate = (models: {[key: string]: ModelCtor<Model<any, any>>}): void => {
        User.hasMany(models.ProfilePicture, {
            as: 'profilePictures',
            foreignKey: {
                name: 'registeredUserId',
                field: 'registered_user_id'
            }
        });
        
        User.hasMany(models.UserJWT, {
            as: 'activeJWTs',
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
        
        User.hasMany(models.PasswordResetToken, {
            as: 'passwordResetTokens',
            foreignKey: {
                name: 'registeredUserId',
                field: 'registered_user_id'
            }
        });
        
        User.hasMany(models.DisplayName, {
            as: 'displayNames',
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
        
        User.hasMany(models.UserConnection, {
            as: 'outgoingConnections',
            foreignKey: {
                name: 'requestedUserId',
                field: 'requested_user_id'
            }
        });
        
        User.hasMany(models.UserConnection, {
            as: 'incomingConnections',
            foreignKey: {
                name: 'connectedUserId',
                field: 'connected_user_id'
            }
        });
    };

    return User;
};
