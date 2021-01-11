import { DataTypes, Model, ModelCtor, Optional, Sequelize, HasManyGetAssociationsMixin, HasManyAddAssociationMixin, HasManyRemoveAssociationMixin, BelongsToManyGetAssociationsMixin, BelongsToManyAddAssociationMixin, BelongsToManyAddAssociationsMixin, BelongsToManyRemoveAssociationMixin, BelongsToManyRemoveAssociationsMixin } from 'sequelize';
import { SequelizeAttributes } from '../typings/SequelizeAttributes';
import { DisplayNameInstance } from './DisplayName';
import { PasswordResetTokenInstance } from './PasswordResetToken';
import { ProfilePictureInstance } from './ProfilePicture';
import { RoleInstance } from './Role';
import { UserConnectionInstance } from './UserConnection';
import { UserJWTInstance } from './UserJWT';

export interface UserAttributes {
    id?: number,
    email: string,
    passwordHash: string,
    uniqueId: string
};

export interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {};

export interface UserInstance extends Model<UserAttributes, UserCreationAttributes>, UserAttributes {
    getProfilePictures: HasManyGetAssociationsMixin<ProfilePictureInstance>;
    addProfilePicture: HasManyAddAssociationMixin<ProfilePictureInstance, ProfilePictureInstance['id']>;

    getActiveUserJWTs: HasManyGetAssociationsMixin<UserJWTInstance>;
    addActiveUserJWT: HasManyAddAssociationMixin<UserJWTInstance, UserJWTInstance['id']>
    removeActiveUserJWT: HasManyRemoveAssociationMixin<UserInstance, UserJWTInstance['id']>

    getInactiveUserJWTs: HasManyGetAssociationsMixin<UserJWTInstance>;
    addInactiveUserJWT: HasManyAddAssociationMixin<UserJWTInstance, UserJWTInstance['id']>

    getPasswordResetTokens: HasManyGetAssociationsMixin<PasswordResetTokenInstance>;
    addPasswordResetToken: HasManyAddAssociationMixin<PasswordResetTokenInstance, PasswordResetTokenInstance['id']>;

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
            primaryKey: true
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
            through: models.UserRoleJunction
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

/*export class User extends Model {
    static associate (models: typeof sequelize.models): void {
        User.hasMany(models.ProfilePicture, {
            as: 'profilePictures',
            foreignKey: 'registered_user_id'
        });
        
        User.hasMany(models.UserJWT, {
            as: 'activeJWTs',
            foreignKey: 'registered_user_id'
        });
        
        User.hasMany(models.UserJWT, {
            as: 'inactiveJWTs',
            foreignKey: 'former_registered_user_id'
        });
        
        User.hasMany(models.PasswordResetToken, {
            as: 'passwordResetTokens',
            foreignKey: 'registered_user_id'
        });
        
        User.hasMany(models.DisplayName, {
            as: 'displayNames',
            foreignKey: 'registered_user_id'
        });
        
        User.belongsToMany(models.Role, {
            as: 'roles',
            through: models.UserRoleJunction
        });
        
        User.hasMany(models.UserConnection, {
            as: 'outgoingConnections',
            foreignKey: 'requested_user_id'
        });
        
        User.hasMany(models.UserConnection, {
            as: 'incomingConnections',
            foreignKey: 'connected_user_id'
        });
    }
};

User.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
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
    }
},{
    sequelize,
    modelName: 'registered_user',
    timestamps: false
});*/
