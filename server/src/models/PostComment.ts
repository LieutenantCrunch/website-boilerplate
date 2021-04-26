import { BelongsToGetAssociationMixin, DataTypes, HasManyAddAssociationMixin, HasManyGetAssociationsMixin, Model, ModelCtor, Optional, Sequelize } from 'sequelize';
import { SequelizeAttributes } from '../typings/SequelizeAttributes';
import { UserInstance } from './User';
import { PostInstance } from './Post';

export interface PostCommentAttributes {
    id?: number;
    postId?: number;
    registeredUserId: number;
    parentCommentId?: number;
    commentText: string;
    uniqueId: string;
    registeredUser?: UserInstance;
    post?: PostInstance;
    parentComment?: PostCommentInstance;
    childComments?: PostCommentInstance[];
};

export interface PostCommentCreationAttributes extends Optional<PostCommentAttributes, 'id'>,
    Optional<PostCommentAttributes, 'postId'>,
    Optional<PostCommentAttributes, 'parentCommentId'> {};

export interface PostCommentInstance extends Model<PostCommentAttributes, PostCommentCreationAttributes>, PostCommentAttributes {
    getRegisteredUser: BelongsToGetAssociationMixin<UserInstance>;
    getPost: BelongsToGetAssociationMixin<PostInstance>;
    getParentComment: BelongsToGetAssociationMixin<PostCommentInstance>;
    getChildComments: HasManyGetAssociationsMixin<PostCommentInstance>;
};

export const PostCommentFactory = (sequelize: Sequelize): ModelCtor<PostCommentInstance> => {
    const attributes: SequelizeAttributes<PostCommentAttributes> = {
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
        parentCommentId: {
            type: DataTypes.INTEGER,
            field: 'parent_comment_id',
            allowNull: true
        },
        commentText: {
            type: DataTypes.STRING(500),
            field: 'comment_text',
            allowNull: false
        },
        uniqueId: {
            type: DataTypes.STRING(36),
            field: 'unique_id',
            allowNull: false
        }
    };

    const PostComment = sequelize.define<PostCommentInstance, PostCommentAttributes>('PostComment', attributes,{
        tableName: 'post_comment'
    });

    // @ts-ignore
    PostComment.associate = (models: {[key: string]: ModelCtor<Model<any, any>>}): void => {
        PostComment.belongsTo(models.Post, {
            as: 'post',
            foreignKey: {
                name: 'postId',
                field: 'post_id'
            }
        });

        PostComment.belongsTo(models.User, {
            as: 'registeredUser',
            foreignKey: {
                name: 'registeredUserId',
                field: 'registered_user_id'
            }
        });

        PostComment.belongsTo(models.PostComment, {
            as: 'parentComment',
            foreignKey: {
                name: 'parentCommentId',
                field: 'parent_comment_id'
            }
        });

        PostComment.hasMany(models.PostComment, {
            as: 'childComments',
            foreignKey: {
                name: 'parentCommentId',
                field: 'parent_comment_id'
            }
        });
    };

    return PostComment;
};
