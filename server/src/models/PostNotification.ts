import { BelongsToGetAssociationMixin, DataTypes, Model, ModelCtor, Optional, Sequelize } from 'sequelize';
import { SequelizeAttributes } from '../typings/SequelizeAttributes';
import { UserInstance } from './User';
import { PostInstance } from './Post';
import { PostCommentInstance } from './PostComment';
import * as ClientConstants from '../constants/constants.client';

export interface PostNotificationAttributes {
    id?: number;
    postId: number;
    registeredUserId: number;
    commentId?: number;
    triggeredByUserId: number;
    notificationType: number;
    createdOn: Date;
    message?: string;
    notificationStatus?: number;
    post?: PostInstance;
    registeredUser?: UserInstance;
    comment?: PostCommentInstance;
    triggeredByUser?: UserInstance;
};

export interface PostNotificationCreationAttributes extends Optional<PostNotificationAttributes, 'id'>,
    Optional<PostNotificationAttributes, 'commentId'>,
    Optional<PostNotificationAttributes, 'message'> {};

export interface PostNotificationInstance extends Model<PostNotificationAttributes, PostNotificationCreationAttributes>, PostNotificationAttributes {
    getComment: BelongsToGetAssociationMixin<PostCommentInstance>;
    getPost: BelongsToGetAssociationMixin<PostInstance>;
    getRegisteredUser: BelongsToGetAssociationMixin<UserInstance>;
    getTriggeredByUser: BelongsToGetAssociationMixin<UserInstance>;
};

export const PostNotificationFactory = (sequelize: Sequelize): ModelCtor<PostNotificationInstance> => {
    const attributes: SequelizeAttributes<PostNotificationAttributes> = {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        postId: {
            type: DataTypes.INTEGER,
            field: 'post_id',
            allowNull: false
        },
        registeredUserId: {
            type: DataTypes.INTEGER,
            field: 'registered_user_id',
            allowNull: false
        },
        commentId: {
            type: DataTypes.INTEGER,
            field: 'comment_id'
        },
        triggeredByUserId: {
            type: DataTypes.INTEGER,
            field: 'triggered_by_user_id',
            allowNull: false
        },
        notificationType: {
            type: DataTypes.INTEGER,
            field: 'notification_type',
            allowNull: false
        },
        createdOn: {
            type: DataTypes.DATE,
            field: 'created_on',
            allowNull: false
        },
        message: {
            type: DataTypes.STRING(500),
            field: 'message'
        },
        notificationStatus: {
            type: DataTypes.INTEGER,
            field: 'notification_status',
            allowNull: false,
            defaultValue: ClientConstants.NOTIFICATION_STATUS.UNSEEN
        }
    };

    const PostNotification = sequelize.define<PostNotificationInstance, PostNotificationAttributes>('PostNotification', attributes,{
        tableName: 'post_notification'
    });

    // @ts-ignore
    PostNotification.associate = (models: {[key: string]: ModelCtor<Model<any, any>>}): void => {
        PostNotification.belongsTo(models.PostComment, {
            as: 'comment',
            foreignKey: {
                name: 'commentId',
                field: 'comment_id'
            }
        });
        
        PostNotification.belongsTo(models.Post, {
            as: 'post',
            foreignKey: {
                name: 'postId',
                field: 'post_id'
            }
        });

        PostNotification.belongsTo(models.User, {
            as: 'registeredUser',
            foreignKey: {
                name: 'registeredUserId',
                field: 'registered_user_id'
            }
        });

        PostNotification.belongsTo(models.User, {
            as: 'triggeredByUser',
            foreignKey: {
                name: 'triggeredByUserId',
                field: 'triggered_by_user_id'
            }
        });
    };

    return PostNotification;
};
