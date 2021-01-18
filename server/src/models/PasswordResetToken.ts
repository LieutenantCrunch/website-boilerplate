import { BelongsToGetAssociationMixin, DataTypes, Model, ModelCtor, Optional, Sequelize } from 'sequelize';
import { SequelizeAttributes } from '../typings/SequelizeAttributes';
import { UserInstance } from './User';

export interface PasswordResetTokenAttributes {
    id?: number;
    registeredUserId: number;
    expirationDate: Date;
    token: string;
    user?: UserInstance;
};

export interface PasswordResetTokenCreationAttributes extends Optional<PasswordResetTokenAttributes, 'id'> {};

export interface PasswordResetTokenInstance extends Model<PasswordResetTokenAttributes, PasswordResetTokenCreationAttributes>, PasswordResetTokenAttributes {
    getUser: BelongsToGetAssociationMixin<UserInstance>;
};

export const PasswordResetTokenFactory = (sequelize: Sequelize): ModelCtor<PasswordResetTokenInstance> => {
    const attributes: SequelizeAttributes<PasswordResetTokenAttributes> = {
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
        expirationDate: {
            type: DataTypes.DATE,
            field: 'expiration_date'
        },
        token: {
            type: DataTypes.STRING(36),
            field: 'token'
        }
    };

    const PasswordResetToken = sequelize.define<PasswordResetTokenInstance, PasswordResetTokenAttributes>('PasswordResetToken', attributes,{
        tableName: 'password_reset_token'
    });

    // @ts-ignore
    PasswordResetToken.associate = (models: {[key: string]: ModelCtor<Model<any, any>>}): void => {
        PasswordResetToken.belongsTo(models.User, {
            as: 'registeredUser',
            foreignKey: {
                name: 'registeredUserId',
                field: 'registered_user_id'
            }
        });
    };

    return PasswordResetToken;
};

/*export class PasswordResetToken extends Model {
    static associate (models: typeof sequelize.models): void {
        PasswordResetToken.hasOne(models.User, {
            as: 'registeredUser',
            sourceKey: 'registered_user_id'
        });
    }
};

PasswordResetToken.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    registeredUserId: {
        type: DataTypes.INTEGER,
        field: 'registered_user_id'
    },
    expirationDate: {
        type: DataTypes.DATE,
        field: 'expiration_date'
    },
    token: {
        type: DataTypes.STRING(36),
        field: 'token'
    }
},{
    sequelize,
    modelName: 'password_reset_token',
    timestamps: false
});
*/
