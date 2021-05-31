import { BelongsToGetAssociationMixin, DataTypes, Model, ModelCtor, Optional, Sequelize } from 'sequelize';
import { SequelizeAttributes } from '../typings/SequelizeAttributes';
import { UserInstance } from './User';
import { PostInstance } from './Post';

export interface PostFileAttributes {
    id?: number;
    postId?: number;
    registeredUserId: number;
    fileName: string;
    fileSize: number;
    mimeType: string;
    originalFileName: string;
    thumbnailFileName?: string | null;
    user?: UserInstance;
    post?: PostInstance;
};

export interface PostFileCreationAttributes extends Optional<PostFileAttributes, 'id'>,
    Optional<PostFileAttributes, 'postId'> {};

export interface PostFileInstance extends Model<PostFileAttributes, PostFileCreationAttributes>, PostFileAttributes {
    getUser: BelongsToGetAssociationMixin<UserInstance>;
    getPost: BelongsToGetAssociationMixin<PostInstance>;
};

export const PostFileFactory = (sequelize: Sequelize): ModelCtor<PostFileInstance> => {
    const attributes: SequelizeAttributes<PostFileAttributes> = {
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
        fileName: {
            type: DataTypes.STRING(200),
            field: 'file_name',
            allowNull: false
        },
        fileSize: {
            type: DataTypes.INTEGER,
            field: 'file_size',
            allowNull: false
        },
        mimeType: {
            type: DataTypes.STRING(50),
            field: 'mime_type',
            allowNull: false
        },
        originalFileName: {
            type: DataTypes.STRING(150),
            field: 'original_file_name',
            allowNull: false
        },
        thumbnailFileName: {
            type: DataTypes.STRING(204),
            field: 'thumbnail_file_name'
        }
    };

    const PostFile = sequelize.define<PostFileInstance, PostFileAttributes>('PostFile', attributes,{
        tableName: 'post_file'
    });

    // @ts-ignore
    PostFile.associate = (models: {[key: string]: ModelCtor<Model<any, any>>}): void => {
        PostFile.belongsTo(models.Post, {
            as: 'post',
            foreignKey: {
                name: 'postId',
                field: 'post_id'
            }
        });

        PostFile.belongsTo(models.User, {
            as: 'registeredUser',
            foreignKey: {
                name: 'registeredUserId',
                field: 'registered_user_id'
            }
        });
    };

    return PostFile;
};
