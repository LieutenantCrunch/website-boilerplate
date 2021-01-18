import { BelongsToManyAddAssociationMixin, BelongsToManyAddAssociationsMixin, BelongsToManyGetAssociationsMixin, DataTypes, Model, ModelCtor, Optional, Sequelize } from 'sequelize';
import { SequelizeAttributes } from '../typings/SequelizeAttributes';
import { UserInstance } from './User';

export interface RoleAttributes {
    id?: number,
    roleName: string,
    users?: UserInstance[];
};

export interface RoleCreationAttributes extends Optional<RoleAttributes, 'id'> {};

export interface RoleInstance extends Model<RoleAttributes, RoleCreationAttributes>, RoleAttributes {
    getUsers: BelongsToManyGetAssociationsMixin<UserInstance>;
    addUser: BelongsToManyAddAssociationMixin<UserInstance, UserInstance['id']>;
    addUsers: BelongsToManyAddAssociationsMixin<UserInstance, UserInstance['id']>;
};

export const RoleFactory = (sequelize: Sequelize): ModelCtor<RoleInstance> => {
    const attributes: SequelizeAttributes<RoleAttributes> = {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        roleName: {
            type: DataTypes.STRING(100),
            field: 'role_name'
        }
    };

    const Role = sequelize.define<RoleInstance, RoleAttributes>('Role', attributes,{
        tableName: 'registered_user_role'
    });

    // @ts-ignore
    Role.associate = (models: {[key: string]: ModelCtor<Model<any, any>>}): void => {
        Role.belongsToMany(models.User, {
            as: 'users',
            through: models.UserRoleJunction,
            foreignKey: {
                name: 'registeredUserRoleId',
                field: 'registered_user_role_id'
            }
        });
    };

    return Role;
};
