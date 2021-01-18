import { BelongsToGetAssociationMixin } from 'sequelize';
import { DataTypes, Model, ModelCtor, Optional, Sequelize } from 'sequelize';
import { SequelizeAttributes } from '../typings/SequelizeAttributes';
import { UserAttributes, UserInstance } from './User';

export interface DisplayNameAttributes {
    id?: number;
    registeredUserId: number;
    displayName: string;
    displayNameIndex: number;
    activationDate: Date;
    isActive: Boolean;
    registeredUser?: UserInstance;
};

export interface DisplayNameCreationAttributes extends Optional<DisplayNameAttributes, 'id'> {};

export interface DisplayNameInstance extends Model<DisplayNameAttributes, DisplayNameCreationAttributes>, DisplayNameAttributes {
    getRegisteredUser: BelongsToGetAssociationMixin<UserInstance>;
};

export const DisplayNameFactory = (sequelize: Sequelize): ModelCtor<DisplayNameInstance> => {
    const attributes: SequelizeAttributes<DisplayNameAttributes> = {
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
        displayName: {
            type: DataTypes.STRING(100),
            field: 'display_name'
        },
        displayNameIndex: {
            type: DataTypes.INTEGER,
            field: 'display_name_index'
        },
        activationDate: {
            type: DataTypes.DATE,
            field: 'activation_date'
        },
        isActive: {
            type: DataTypes.TINYINT,
            field: 'is_active'
        }
    };

    const DisplayName = sequelize.define<DisplayNameInstance, DisplayNameAttributes>('DisplayName', attributes,{
        tableName: 'registered_user_display_name'
    });

    // @ts-ignore
    DisplayName.associate = (models: {[key: string]: ModelCtor<Model<any, any>>}): void => {
        DisplayName.belongsTo(models.User, {
            as: 'registeredUser',
            foreignKey: {
                name: 'registeredUserId',
                field: 'registered_user_id'
            }
        });
    };

    return DisplayName;
};

/*export class DisplayName extends Model {
    static associate (models: typeof sequelize.models): void {
        DisplayName.hasOne(models.User, {
            as: 'registeredUser',
            sourceKey: 'registered_user_id'
        });
    }
};

DisplayName.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    registeredUserId: {
        type: DataTypes.INTEGER,
        field: 'registered_user_id'
    },
    displayName: {
        type: DataTypes.STRING(100),
        field: 'display_name'
    },
    displayNameIndex: {
        type: DataTypes.INTEGER,
        field: 'display_name_index'
    },
    activationDate: {
        type: DataTypes.DATE,
        field: 'activation_date'
    },
    isActive: {
        type: DataTypes.TINYINT,
        field: 'is_active'
    }
},{
    sequelize,
    modelName: 'registered_user_display_name',
    timestamps: false
});*/
