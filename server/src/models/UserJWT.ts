import { BelongsToGetAssociationMixin, DataTypes, Model, ModelCtor, Optional, Sequelize } from 'sequelize';
import { SequelizeAttributes } from '../typings/SequelizeAttributes';
import { UserInstance } from './User';

export interface UserJWTAttributes {
    id?: number;
    registeredUserId?: number;
    jti: string;
    expirationDate: Date;
    isValid: Boolean;
    formerRegisteredUserId?: number;
    registeredUser?: UserInstance[];
    formerRegisteredUser?: UserInstance[];
};

export interface UserJWTCreationAttributes extends Optional<UserJWTAttributes, 'id'>
    , Optional<UserJWTAttributes, 'registeredUserId'>
    , Optional<UserJWTAttributes, 'formerRegisteredUserId'> {};

export interface UserJWTInstance extends Model<UserJWTAttributes, UserJWTCreationAttributes>, UserJWTAttributes {
    getRegisteredUser: BelongsToGetAssociationMixin<UserInstance>;
    getFormerRegisteredUser: BelongsToGetAssociationMixin<UserInstance>;
};

export const UserJWTFactory = (sequelize: Sequelize): ModelCtor<UserJWTInstance> => {
    const attributes: SequelizeAttributes<UserJWTAttributes> = {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        registeredUserId: {
            type: DataTypes.INTEGER,
            field: 'registered_user_id'
        },
        jti: {
            type: DataTypes.UUIDV4,
            field: 'jti'
        },
        expirationDate: {
            type: DataTypes.DATE,
            field: 'expiration_date'
        },
        isValid: {
            type: DataTypes.TINYINT,
            field: 'is_valid'
        },
        formerRegisteredUserId: {
            type: DataTypes.INTEGER,
            field: 'former_registered_user_id'
        }
    };

    const UserJWT = sequelize.define<UserJWTInstance, UserJWTAttributes>('UserJWT', attributes,{
        tableName: 'user_jwt'
    });

    // @ts-ignore
    UserJWT.associate = (models: {[key: string]: ModelCtor<Model<any, any>>}): void => {
        UserJWT.belongsTo(models.User, {
            as: 'registeredUser',
            foreignKey: {
                name: 'registeredUserId',
                field: 'registered_user_id'
            }
        });
        
        UserJWT.belongsTo(models.User, {
            as: 'formerRegisteredUser',
            foreignKey: {
                name: 'formerRegisteredUserId',
                field: 'former_registered_user_id'
            }
        });
    };

    return UserJWT;
};
