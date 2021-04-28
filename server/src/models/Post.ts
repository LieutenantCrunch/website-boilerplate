import { DataTypes, Model, ModelCtor, Optional, Sequelize } from 'sequelize';
import { 
    BelongsToGetAssociationMixin, 
    HasManyAddAssociationMixin, 
    HasManyAddAssociationsMixin,
    HasManyCreateAssociationMixin,
    HasManyGetAssociationsMixin, 
    HasManyRemoveAssociationMixin,
    HasManyRemoveAssociationsMixin,
    BelongsToManyAddAssociationMixin,
    BelongsToManyAddAssociationsMixin,
    BelongsToManyGetAssociationsMixin,
    BelongsToManyRemoveAssociationMixin,
    BelongsToManyRemoveAssociationsMixin
} from 'sequelize';
import { SequelizeAttributes } from '../typings/SequelizeAttributes';
import { UserInstance } from './User';
import { PostFileInstance } from './PostFile';
import { UserConnectionTypeInstance } from './UserConnectionType';
import { PostCommentInstance } from './PostComment';

export interface PostAttributes {
    id?: number;
    registeredUserId: number;
    audience: number;
    flagType?: number;
    lastEditedOn?: Date;
    postText?: string | null;
    postTitle?: string | null;
    postType: number;
    postedOn: Date;
    uniqueId: string;
    user?: UserInstance;
    postComments?: PostCommentInstance[];
    postFiles?: PostFileInstance[];
    commentCount?: number;
};

export interface PostCreationAttributes extends Optional<PostAttributes, 'id'>,
    Optional<PostAttributes, 'lastEditedOn'>,
    Optional<PostAttributes, 'flagType'> {};

export interface PostInstance extends Model<PostAttributes, PostCreationAttributes>, PostAttributes {
    getRegisteredUser: BelongsToGetAssociationMixin<UserInstance>;
    
    getPostComments: HasManyGetAssociationsMixin<PostCommentInstance>;

    addPostFile: HasManyAddAssociationMixin<PostFileInstance, PostFileInstance['id']>;
    addPostFiles: HasManyAddAssociationsMixin<PostFileInstance, PostFileInstance['id']>;
    getPostFiles: HasManyGetAssociationsMixin<PostFileInstance>;
    removePostFile: HasManyRemoveAssociationMixin<PostFileInstance, PostFileInstance['id']>;
    removePostFiles: HasManyRemoveAssociationsMixin<PostFileInstance, PostFileInstance['id']>;

    getConnectionTypes: BelongsToManyGetAssociationsMixin<UserConnectionTypeInstance>;
    addConnectionType: BelongsToManyAddAssociationMixin<UserConnectionTypeInstance, UserConnectionTypeInstance['id']>;
    addConnectionTypes: BelongsToManyAddAssociationsMixin<UserConnectionTypeInstance, UserConnectionTypeInstance['id']>;
    removeConnectionType: BelongsToManyRemoveAssociationMixin<UserConnectionTypeInstance, UserConnectionTypeInstance['id']>;
    removeConnectionTypes: BelongsToManyRemoveAssociationsMixin<UserConnectionTypeInstance, UserConnectionTypeInstance['id']>;
};

export const PostFactory = (sequelize: Sequelize): ModelCtor<PostInstance> => {
    const attributes: SequelizeAttributes<PostAttributes> = {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        registeredUserId: {
            type: DataTypes.INTEGER,
            field: 'registered_user_id',
            allowNull: false
        },
        audience: {
            type: DataTypes.INTEGER,
            field: 'audience',
            allowNull: false
        },
        flagType: {
            type: DataTypes.INTEGER,
            field: 'flag_type'
        },
        lastEditedOn: {
            type: DataTypes.DATE,
            field: 'last_edited_on'
        },
        postText: {
            type: DataTypes.STRING(2000),
            field: 'post_text',
        },
        postTitle: {
            type: DataTypes.STRING(50),
            field: 'post_title'
        },
        postType: {
            type: DataTypes.INTEGER,
            field: 'post_type',
            allowNull: false
        },
        postedOn: {
            type: DataTypes.DATE,
            field: 'posted_on',
            allowNull: false
        },
        uniqueId: {
            type: DataTypes.STRING(36),
            field: 'unique_id',
            allowNull: false
        }
    };

    const Post = sequelize.define<PostInstance, PostAttributes>('Post', attributes,{
        tableName: 'post'
    });

    // @ts-ignore
    Post.associate = (models: {[key: string]: ModelCtor<Model<any, any>>}): void => {
        Post.belongsToMany(models.UserConnectionType, {
            as: 'connectionTypes',
            through: models.PostCustomAudience,
            foreignKey: {
                name: 'postId',
                field: 'post_id'
            }
        });

        Post.hasMany(models.PostComment, {
            as: 'postComments',
            foreignKey: {
                name: 'postId',
                field: 'post_id'
            }
        });

        Post.hasMany(models.PostFile, {
            as: 'postFiles',
            foreignKey: {
                name: 'postId',
                field: 'post_id'
            }
        });

        Post.belongsTo(models.User, {
            as: 'registeredUser',
            foreignKey: {
                name: 'registeredUserId',
                field: 'registered_user_id'
            }
        });
    };

    return Post;
};
