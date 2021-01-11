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
            primaryKey: true
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
            through: models.UserConnectionTypeJunction
        });
    };

    return UserConnectionType;
};

/*export class UserConnectionType extends Model {
    static associate (models: typeof sequelize.models): void {
        UserConnectionType.belongsToMany(models.UserConnection, {
            as: 'connections',
            through: models.UserConnectionTypeJunction
        });
    }
};

UserConnectionType.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    displayName: {
        type: DataTypes.STRING(100),
        field: 'display_name',
        unique: true
    }
},{
    sequelize,
    modelName: 'registered_user_connection_type',
    timestamps: false
});*/
