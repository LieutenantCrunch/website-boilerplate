import { BelongsToGetAssociationMixin, BelongsToManyAddAssociationMixin, BelongsToManyRemoveAssociationsMixin } from 'sequelize';
import { BelongsToManyAddAssociationsMixin, BelongsToManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin } from 'sequelize';
import { DataTypes, Model, ModelCtor, Op, Optional, Sequelize } from 'sequelize';
import { SequelizeAttributes } from '../typings/SequelizeAttributes';
import { UserInstance } from './User';
import { UserConnectionTypeInstance } from './UserConnectionType';

export interface UserConnectionAttributes {
    id?: number;
    requestedUserId: number;
    connectedUserId: number;
    requestedUser?: UserInstance;
    connectedUser?: UserInstance;
    connectionTypes?: UserConnectionTypeInstance[];
};

export interface UserConnectionCreationAttributes extends Optional<UserConnectionAttributes, 'id'> {};

export interface UserConnectionInstance extends Model<UserConnectionAttributes, UserConnectionCreationAttributes>, UserConnectionAttributes {
    getRequestedUser: BelongsToGetAssociationMixin<UserInstance>;
    getConnectedUser: BelongsToGetAssociationMixin<UserInstance>;

    getConnectionTypes: BelongsToManyGetAssociationsMixin<UserConnectionTypeInstance>;
    addConnectionType: BelongsToManyAddAssociationMixin<UserConnectionTypeInstance, UserConnectionTypeInstance['id']>;
    addConnectionTypes: BelongsToManyAddAssociationsMixin<UserConnectionTypeInstance, UserConnectionTypeInstance['id']>;
    removeConnectionType: BelongsToManyRemoveAssociationMixin<UserConnectionTypeInstance, UserConnectionTypeInstance['id']>;
    removeConnectionTypes: BelongsToManyRemoveAssociationsMixin<UserConnectionTypeInstance, UserConnectionTypeInstance['id']>;
};

export const UserConnectionFactory = (sequelize: Sequelize): ModelCtor<UserConnectionInstance> => {
    const attributes: SequelizeAttributes<UserConnectionAttributes> = {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        requestedUserId: {
            type: DataTypes.INTEGER,
            field: 'requested_user_id'
        },
        connectedUserId: {
            type: DataTypes.INTEGER,
            field: 'connected_user_id'
        }
    };

    const UserConnection = sequelize.define<UserConnectionInstance, UserConnectionAttributes>('UserConnection', attributes,{
        tableName: 'registered_user_connection'
    });

    // @ts-ignore
    UserConnection.associate = (models: {[key: string]: ModelCtor<Model<any, any>>}): void => {
        UserConnection.belongsTo(models.User, {
            as: 'requestedUser',
            foreignKey: {
                name: 'requestedUserId',
                field: 'requested_user_id'
            }
        });
        
        UserConnection.belongsTo(models.User, {
            as: 'connectedUser',
            foreignKey: {
                name: 'connectedUserId',
                field: 'connected_user_id'
            }
        });
        
        UserConnection.belongsToMany(models.UserConnectionType, {
            as: 'connectionTypes', 
            through: models.UserConnectionTypeJunction,
            foreignKey: {
                name: 'registeredUserConnectionId',
                field: 'registered_user_connection_id'
            }
        });

        // This relationship is necessary to be able to join UserBlock for determining whether an outgoingConnection
        // is to a user that is blocking the current user.
        // From: https://stackoverflow.com/questions/42226351/sequelize-join-with-multiple-column
        UserConnection.hasOne(models.UserBlock, {
            as: 'userBlock',
            foreignKey: 'blockedUserId',
            sourceKey: 'requestedUserId',
            scope: {
                [Op.and]: Sequelize.where(Sequelize.col('userConnection.connected_user_id'),
                Op.eq,
                Sequelize.col('`userConnection->userBlock`.registered_user_id'))
            },
            constraints: false
        });
    };

    return UserConnection;
};
