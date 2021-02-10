import { BelongsToSetAssociationMixin, BelongsToGetAssociationMixin } from 'sequelize';
import { DataTypes, Model, ModelCtor, Optional, Sequelize } from 'sequelize';
import { SequelizeAttributes } from '../typings/SequelizeAttributes';
import { UserInstance } from './User';

export interface UserBlockAttributes {
    id?: number;
    registeredUserId: number;
    blockedUserId: number;
    registeredUser?: UserInstance;
    blockedUser?: UserInstance;
};

export interface UserBlockCreationAttributes extends Optional<UserBlockAttributes, 'id'> {};

export interface UserBlockInstance extends Model<UserBlockAttributes, UserBlockCreationAttributes>, UserBlockAttributes {
    getRegisteredUser: BelongsToGetAssociationMixin<UserInstance>;
    setRegisteredUser: BelongsToSetAssociationMixin<UserInstance, UserInstance['id']>;

    getBlockedUser: BelongsToGetAssociationMixin<UserInstance>;
    setBlockedUser: BelongsToSetAssociationMixin<UserInstance, UserInstance['id']>;
};

export const UserBlockFactory = (sequelize: Sequelize): ModelCtor<UserBlockInstance> => {
    const attributes: SequelizeAttributes<UserBlockAttributes> = {
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
        blockedUserId: {
            type: DataTypes.INTEGER,
            field: 'blocked_user_id'
        }
    };

    const UserBlock = sequelize.define<UserBlockInstance, UserBlockAttributes>('UserBlock', attributes,{
        tableName: 'registered_user_block'
    });

    // @ts-ignore
    UserBlock.associate = (models: {[key: string]: ModelCtor<Model<any, any>>}): void => {
        UserBlock.belongsTo(models.User, {
            as: 'registeredUser',
            foreignKey: {
                name: 'registeredUserId',
                field: 'registered_user_id'
            }
        });
        
        UserBlock.belongsTo(models.User, {
            as: 'blockedUser',
            foreignKey: {
                name: 'blockedUserId',
                field: 'blocked_user_id'
            }
        });
    };

    return UserBlock;
};
