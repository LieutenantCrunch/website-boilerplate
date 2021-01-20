import { BelongsToGetAssociationMixin, BelongsToManyGetAssociationsMixin, DataTypes, Model, ModelCtor, Sequelize } from 'sequelize';
import { SequelizeAttributes } from '../../typings/SequelizeAttributes';
import { UserInstance } from '../User';
import { UserConnectionInstance } from '../UserConnection';

export interface UserConnectionViewAttributes {
    id: number;
    requestedUserId: number;
    connectedUserId: number;
    isMutual: Boolean;
    requestedUser?: UserInstance;
    connectedUser?: UserInstance;
    userConnection?: UserConnectionInstance;
};

export interface UserConnectionViewInstance extends Model<UserConnectionViewAttributes>, UserConnectionViewAttributes {
    // This is a View, do not expose anything but get methods
    getRequestedUser: BelongsToGetAssociationMixin<UserInstance>;
    getConnectedUser: BelongsToGetAssociationMixin<UserInstance>;

    getUserConnection: BelongsToGetAssociationMixin<UserConnectionInstance>;
};

export const UserConnectionViewFactory = (sequelize: Sequelize): ModelCtor<UserConnectionViewInstance> => {
    const attributes: SequelizeAttributes<UserConnectionViewAttributes> = {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        requestedUserId: {
            type: DataTypes.INTEGER,
            field: 'requested_user_id'
        },
        connectedUserId: {
            type: DataTypes.INTEGER,
            field: 'connected_user_id'
        },
        isMutual: {
            type: DataTypes.TINYINT,
            field: 'is_mutual'
        }
    };

    const UserConnectionView = sequelize.define<UserConnectionViewInstance, UserConnectionViewAttributes>('UserConnectionView', attributes,{
        tableName: 'registered_user_connection_view'
    });

    // @ts-ignore
    UserConnectionView.associate = (models: {[key: string]: ModelCtor<Model<any, any>>}): void => {
        UserConnectionView.belongsTo(models.User, {
            as: 'requestedUser',
            foreignKey: {
                name: 'requestedUserId',
                field: 'requested_user_id'
            }
        });
        
        UserConnectionView.belongsTo(models.User, {
            as: 'connectedUser',
            foreignKey: {
                name: 'connectedUserId',
                field: 'connected_user_id'
            }
        });
        
        UserConnectionView.belongsTo(models.UserConnection, {
            as: 'userConnection', 
            foreignKey: {
                name: 'id',
                field: 'id'
            }
        });
    };

    return UserConnectionView;
};
