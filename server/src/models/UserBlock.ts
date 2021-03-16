import { DataTypes, Model, ModelCtor, Optional, Sequelize } from 'sequelize';
import { SequelizeAttributes } from '../typings/SequelizeAttributes';

export interface UserBlockAttributes {
    registeredUserId: number,
    blockedUserId: number
};

export interface UserBlockInstance extends Model<UserBlockAttributes>, UserBlockAttributes {};

export const UserBlockFactory = (sequelize: Sequelize): ModelCtor<UserBlockInstance> => {
    const attributes: SequelizeAttributes<UserBlockAttributes> = {
        registeredUserId: {
            type: DataTypes.INTEGER,
            field: 'registered_user_id',
            references: {
                model: 'User',
                key: 'id'
            }
        },
        blockedUserId: {
            type: DataTypes.INTEGER,
            field: 'blocked_user_id',
            references: {
                model: 'User',
                key: 'id'
            }
        }
    };

    const UserBlock = sequelize.define<UserBlockInstance, UserBlockAttributes>('UserBlock', attributes,{
        tableName: 'registered_user_block'
    });

    return UserBlock;
};
