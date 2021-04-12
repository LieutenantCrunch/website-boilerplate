import { DataTypes, HasManyGetAssociationsMixin, Model, ModelCtor, Sequelize } from 'sequelize';
import { SequelizeAttributes } from '../../typings/SequelizeAttributes';
import { PostFileInstance } from '../PostFile';

export interface FeedViewAttributes {
    id: number;
    postedByUniqueId: string;
    postedByProfileName: string;
    postedByDisplayName: string;
    postedByDisplayNameIndex: number;
    postedByPfpSmall: string | null;
    postText: string | null;
    postTitle: string | null;
    postType: number;
    postedOn: Date;
    lastEditedOn: Date | null;
    uniqueId: string;
    userUniqueId: string;
    postFiles?: PostFileInstance[];
};

export interface FeedViewInstance extends Model<FeedViewAttributes>, FeedViewAttributes {
    // This is a View, do not expose anything but get methods
    getPostFiles: HasManyGetAssociationsMixin<PostFileInstance>;
};

export const FeedViewFactory = (sequelize: Sequelize): ModelCtor<FeedViewInstance> => {
    const attributes: SequelizeAttributes<FeedViewAttributes> = {
        id: {
            type: DataTypes.NUMBER,
            allowNull: false,
            primaryKey: true
        },
        uniqueId: {
            type: DataTypes.STRING(36),
            allowNull: false,
            field: 'unique_id'
        },
        userUniqueId: {
            type: DataTypes.STRING(36),
            allowNull: false,
            field: 'user_unique_id'
        },
        postedByUniqueId: {
            type: DataTypes.STRING(36),
            allowNull: false,
            field: 'posted_by_unique_id'
        },
        postedByProfileName: {
            type: DataTypes.STRING(20),
            allowNull: false,
            field: 'posted_by_profile_name'
        },
        postedByDisplayName: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: 'posted_by_display_name'
        },
        postedByDisplayNameIndex: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'posted_by_display_name_index'
        },
        postedByPfpSmall: {
            type: DataTypes.STRING(206),
            allowNull: true,
            field: 'posted_by_pfp_small'
        },
        postText: {
            type: DataTypes.STRING(2000),
            allowNull: true,
            field: 'post_text'
        },
        postTitle: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'post_title'
        },
        postType: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'post_type'
        },
        postedOn: {
            type: DataTypes.DATE,
            allowNull: false,
            field: 'posted_on'
        },
        lastEditedOn: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'last_edited_on'
        }
    };

    const FeedView = sequelize.define<FeedViewInstance, FeedViewAttributes>('FeedView', attributes,{
        tableName: 'feed_view'
    });

    // @ts-ignore
    FeedView.associate = (models: {[key: string]: ModelCtor<Model<any, any>>}): void => {
        FeedView.hasMany(models.PostFile, {
            as: 'postFiles',
            foreignKey: {
                name: 'postId',
                field: 'post_id'
            }
        });
    };

    return FeedView;
};
