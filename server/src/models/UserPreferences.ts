import { BelongsToGetAssociationMixin, DataTypes, Model, ModelCtor, Optional, Sequelize } from 'sequelize';
import { SequelizeAttributes } from '../typings/SequelizeAttributes';
import { UserInstance } from './User';

export interface UserPreferencesAttributes {
    id?: number;
    registeredUserId: number;
    startPage?: string;
    showMyPostsInFeed?: Boolean;
    postType?: number;
    mediaVolume?: number;
    feedFilter?: number;
    postAudience?: number;
    customAudience?: string;
    user?: UserInstance;
};

export interface UserPreferencesCreationAttributes extends Optional<UserPreferencesAttributes, 'id'>,
    Optional<UserPreferencesAttributes, 'startPage'>,
    Optional<UserPreferencesAttributes, 'showMyPostsInFeed'>,
    Optional<UserPreferencesAttributes, 'postType'>,
    Optional<UserPreferencesAttributes, 'mediaVolume'>,
    Optional<UserPreferencesAttributes, 'feedFilter'>,
    Optional<UserPreferencesAttributes, 'postAudience'>,
    Optional<UserPreferencesAttributes, 'customAudience'> {};

export interface UserPreferencesInstance extends Model<UserPreferencesAttributes, UserPreferencesCreationAttributes>, UserPreferencesAttributes {
    getUser: BelongsToGetAssociationMixin<UserInstance>;
};

export const UserPreferencesFactory = (sequelize: Sequelize): ModelCtor<UserPreferencesInstance> => {
    const attributes: SequelizeAttributes<UserPreferencesAttributes> = {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        registeredUserId: {
            field: 'registered_user_id',
            type: DataTypes.INTEGER
        },
        startPage: {
            field: 'start_page',
            type: DataTypes.STRING(50)
        },
        showMyPostsInFeed: {
            field: 'show_my_posts_in_feed',
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0
        },
        postType: {
            field: 'post_type',
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        mediaVolume: {
            field: 'media_volume',
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 50
        },
        feedFilter: {
            field: 'feed_filter',
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1000
        },
        postAudience: {
            field: 'post_audience',
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        customAudience: {
            field: 'custom_audience',
            type: DataTypes.STRING(500)
        }
    };

    const UserPreferences = sequelize.define<UserPreferencesInstance, UserPreferencesAttributes>('UserPreferences', attributes,{
        tableName: 'registered_user_preferences'
    });

    // @ts-ignore
    UserPreferences.associate = (models: {[key: string]: ModelCtor<Model<any, any>>}): void => {
        UserPreferences.belongsTo(models.User, {
            as: 'registeredUser',
            foreignKey: {
                name: 'registeredUserId',
                field: 'registered_user_id'
            }
        });
    };

    return UserPreferences;
};
