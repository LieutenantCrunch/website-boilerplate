import { BelongsToManyAddAssociationMixin, BelongsToManyAddAssociationsMixin, BelongsToManyGetAssociationsMixin, DataTypes, Model, ModelCtor, Optional, Sequelize } from 'sequelize';
import { SequelizeAttributes } from '../typings/SequelizeAttributes';
import { UserInstance } from './User';

export interface RoleAttributes {
    id?: number,
    roleName: string
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
            primaryKey: true
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
            through: models.UserRoleJunction
        });
    };

    return Role;
};

/*export class Role extends Model {
    static associate (models: typeof sequelize.models): void {
        Role.belongsToMany(models.User, {
            as: 'users',
            through: models.UserRoleJunction
        });
    }
};

Role.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    roleName: {
        type: DataTypes.STRING(100),
        field: 'role_name'
    }
},{
    sequelize,
    modelName: 'registered_user_role',
    timestamps: false
});*/
