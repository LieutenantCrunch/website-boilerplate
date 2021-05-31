import { DataTypes, Model, ModelCtor, Optional, Sequelize } from 'sequelize';
import { SequelizeAttributes } from '../typings/SequelizeAttributes';

export interface UserConnectionTypeAttributes {
    id?: number,
    displayName: string
};

export interface UserConnectionTypeCreationAttributes extends Optional<UserConnectionTypeAttributes, 'id'> {};

export interface UserConnectionTypeInstance extends Model<UserConnectionTypeAttributes, UserConnectionTypeCreationAttributes>, UserConnectionTypeAttributes {};

export const UserConnectionTypeFactory = (sequelize: Sequelize): ModelCtor<UserConnectionTypeInstance> => {
    const attributes: SequelizeAttributes<UserConnectionTypeAttributes> = {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        displayName: {
            type: DataTypes.STRING(100),
            field: 'display_name',
            unique: true
        }
    };

    const UserConnectionType = sequelize.define<UserConnectionTypeInstance, UserConnectionTypeAttributes>('UserConnectionType', attributes,{
        tableName: 'registered_user_connection_type'
    });

    // @ts-ignore
    UserConnectionType.associate = (models: {[key: string]: ModelCtor<Model<any, any>>}): void => {
        UserConnectionType.belongsToMany(models.UserConnection, {
            as: 'connections',
            through: models.UserConnectionTypeJunction,
            foreignKey: {
                name: 'registeredUserConnectionTypeId',
                field: 'registered_user_connection_type_id'
            }
        });

        UserConnectionType.belongsToMany(models.Post, {
            as: 'posts',
            through: models.PostCustomAudience,
            foreignKey: {
                name: 'connectionTypeId',
                field: 'connection_type_id'
            }
        });
    };

    return UserConnectionType;
};
