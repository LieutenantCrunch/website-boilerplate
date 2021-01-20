import { DataTypes, Model, ModelCtor, Optional, Sequelize } from 'sequelize';
import { SequelizeAttributes } from '../typings/SequelizeAttributes';

export interface UserRoleJunctionAttributes {
    registeredUserId: number,
    registeredUserRoleId: number
};

export interface UserRoleJunctionInstance extends Model<UserRoleJunctionAttributes>, UserRoleJunctionAttributes {};

export const UserRoleJunctionFactory = (sequelize: Sequelize): ModelCtor<UserRoleJunctionInstance> => {
    const attributes: SequelizeAttributes<UserRoleJunctionAttributes> = {
        registeredUserId: {
            type: DataTypes.INTEGER,
            field: 'registered_user_id',
            references: {
                model: 'User',
                key: 'id'
            }
        },
        registeredUserRoleId: {
            type: DataTypes.INTEGER,
            field: 'registered_user_role_id',
            references: {
                model: 'Role',
                key: 'id'
            }
        }
    };

    const UserRoleJunction = sequelize.define<UserRoleJunctionInstance, UserRoleJunctionAttributes>('UserRoleJunction', attributes,{
        tableName: 'registered_user_role_junction'
    });

    return UserRoleJunction;
};
