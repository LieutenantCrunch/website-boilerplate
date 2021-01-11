import { DataTypes, Model, ModelCtor, Optional, Sequelize } from 'sequelize';
import { SequelizeAttributes } from '../typings/SequelizeAttributes';

export interface UserConnectionTypeJunctionAttributes {
    registeredUserConnectionTypeId: number,
    registeredUserConnectionId: number
};

export interface UserConnectionTypeJunctionInstance extends Model<UserConnectionTypeJunctionAttributes>, UserConnectionTypeJunctionAttributes {};

export const UserConnectionTypeJunctionFactory = (sequelize: Sequelize): ModelCtor<UserConnectionTypeJunctionInstance> => {
    const attributes: SequelizeAttributes<UserConnectionTypeJunctionAttributes> = {
        registeredUserConnectionTypeId: {
            type: DataTypes.INTEGER,
            field: 'registered_user_connection_type_id',
            references: {
                model: 'UserConnectionType',
                key: 'id'
            }
        },
        registeredUserConnectionId: {
            type: DataTypes.INTEGER,
            field: 'registered_user_connection_id',
            references: {
                model: 'UserConnection',
                key: 'id'
            }
        }
    };

    const UserConnectionTypeJunction = sequelize.define<UserConnectionTypeJunctionInstance, UserConnectionTypeJunctionAttributes>('UserConnectionTypeJunction', attributes,{
        tableName: 'registered_user_connection_type_junction'
    });

    return UserConnectionTypeJunction;
};

/*export class UserConnectionTypeJunction extends Model {
    static associate (models: typeof sequelize.models): void {
    }
};

UserConnectionTypeJunction.init({
    registeredUserConnectionTypeId: {
        type: DataTypes.INTEGER,
        field: 'registered_user_connection_type_id',
        references: {
            model: UserConnectionType,
            key: 'id'
        }
    },
    registeredUserConnectionId: {
        type: DataTypes.INTEGER,
        field: 'registered_user_connection_id',
        references: {
            model: UserConnection,
            key: 'id'
        }
    }
},{
    sequelize,
    modelName: 'registered_user_connection_type_junction',
    timestamps: false
});*/
