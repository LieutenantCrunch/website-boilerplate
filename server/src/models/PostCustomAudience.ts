import { DataTypes, Model, ModelCtor, Optional, Sequelize } from 'sequelize';
import { SequelizeAttributes } from '../typings/SequelizeAttributes';

export interface PostCustomAudienceAttributes {
    postId: number,
    connectionTypeId: number
};

export interface PostCustomAudienceInstance extends Model<PostCustomAudienceAttributes>, PostCustomAudienceAttributes {};

export const PostCustomAudienceFactory = (sequelize: Sequelize): ModelCtor<PostCustomAudienceInstance> => {
    const attributes: SequelizeAttributes<PostCustomAudienceAttributes> = {
        postId: {
            type: DataTypes.INTEGER,
            field: 'post_id',
            references: {
                model: 'Post',
                key: 'id'
            }
        },
        connectionTypeId: {
            type: DataTypes.INTEGER,
            field: 'connection_type_id',
            references: {
                model: 'UserConnectionType',
                key: 'id'
            }
        }
    };

    const PostCustomAudience = sequelize.define<PostCustomAudienceInstance, PostCustomAudienceAttributes>('PostCustomAudience', attributes,{
        tableName: 'post_custom_audience'
    });

    return PostCustomAudience;
};
