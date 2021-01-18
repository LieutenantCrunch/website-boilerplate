import { BelongsToGetAssociationMixin, DataTypes, Model, ModelCtor, Optional, Sequelize } from 'sequelize';
import { SequelizeAttributes } from '../typings/SequelizeAttributes';
import { UserInstance } from './User';

export interface ProfilePictureAttributes {
    id?: number;
    registeredUserId: number;
    mimeType: string;
    fileName: string;
    originalFileName: string;
    smallFileName: string;
    user?: UserInstance;
};

export interface ProfilePictureCreationAttributes extends Optional<ProfilePictureAttributes, 'id'> {};

export interface ProfilePictureInstance extends Model<ProfilePictureAttributes, ProfilePictureCreationAttributes>, ProfilePictureAttributes {
    getUser: BelongsToGetAssociationMixin<UserInstance>;
};

export const ProfilePictureFactory = (sequelize: Sequelize): ModelCtor<ProfilePictureInstance> => {
    const attributes: SequelizeAttributes<ProfilePictureAttributes> = {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        registeredUserId: {
            type: DataTypes.INTEGER,
            field: 'registered_user_id'
        },
        mimeType: {
            type: DataTypes.STRING(50),
            field: 'mime_type'
        },
        fileName: {
            type: DataTypes.STRING(200),
            field: 'file_name'
        },
        originalFileName: {
            type: DataTypes.STRING(150),
            field: 'original_file_name'
        },
        smallFileName: {
            type: DataTypes.STRING(206),
            field: 'small_file_name'
        }
    };

    const ProfilePicture = sequelize.define<ProfilePictureInstance, ProfilePictureAttributes>('ProfilePicture', attributes,{
        tableName: 'profile_picture'
    });

    // @ts-ignore
    ProfilePicture.associate = (models: {[key: string]: ModelCtor<Model<any, any>>}): void => {
        ProfilePicture.belongsTo(models.User, {
            as: 'registeredUser',
            foreignKey: {
                name: 'registeredUserId',
                field: 'registered_user_id'
            }
        });
    };

    return ProfilePicture;
};

/*export class ProfilePicture extends Model {
    static associate (models: typeof sequelize.models): void {
        ProfilePicture.hasOne(models.User, {
            as: 'registeredUser',
            sourceKey: 'registered_user_id'
        });
    }
};

ProfilePicture.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    registeredUserId: {
        type: DataTypes.INTEGER,
        field: 'registered_user_id'
    },
    mimeType: {
        type: DataTypes.STRING(50),
        field: 'mime_type'
    },
    fileName: {
        type: DataTypes.STRING(200),
        field: 'file_name'
    },
    originalFileName: {
        type: DataTypes.STRING(150),
        field: 'original_file_name'
    },
    smallFileName: {
        type: DataTypes.STRING(206),
        field: 'small_file_name'
    }
},{
    sequelize,
    modelName: 'profile_picture',
    timestamps: false
});*/
