import * as ServerConstants from '../constants/constants.server';

import { Sequelize } from 'sequelize';
import SequelizeSimpleCache from 'sequelize-simple-cache';
import { DbInterface } from '../typings/DbInterface';

// Main Tables
import { DisplayNameFactory } from '../models/DisplayName';
import { PasswordResetTokenFactory } from '../models/PasswordResetToken';
import { PostFactory } from '../models/Post';
import { PostCommentFactory } from '../models/PostComment';
import { PostFileFactory } from '../models/PostFile';
import { ProfilePictureFactory } from '../models/ProfilePicture';
import { RoleFactory } from '../models/Role';
import { UserFactory } from '../models/User';
import { UserBlockFactory } from '../models/UserBlock';
import { UserConnectionFactory } from '../models/UserConnection';
import { UserConnectionTypeFactory } from '../models/UserConnectionType';
import { UserJWTFactory } from '../models/UserJWT';

// Junction Tables
import { PostCustomAudienceFactory } from '../models/PostCustomAudience';
import { UserConnectionTypeJunctionFactory } from '../models/UserConnectionTypeJunction';
import { UserRoleJunctionFactory } from '../models/UserRoleJunction';

// Views
import { FeedViewFactory } from '../models/views/FeedView';
import { UserConnectionViewFactory } from '../models/views/UserConnectionView';

const dbconfig = require('../../private/dbconfig.json');
const currentConfig = dbconfig['dev'];

const sequelizeConfig = {
    dialect: currentConfig['type'],
    host: currentConfig['host'],
    port: currentConfig['port'],
    database: currentConfig['database'],
    username: currentConfig['username'],
    password: currentConfig['password'],
    logging: currentConfig['logging'],
    define: {
        freezeTableName: true,
        timestamps: false
    }
};

const createModels = (sequelizeConfig: any): DbInterface => {
    const sequelize = new Sequelize(sequelizeConfig);
    const cache: SequelizeSimpleCache = new SequelizeSimpleCache({
        UserConnectionType: { ttl: ServerConstants.CONNECTION_TYPES_CACHE_HOURS * 60 * 60 * 1000 }
    });

    const db: DbInterface = {
        sequelize,
        DisplayName: DisplayNameFactory(sequelize),
        PasswordResetToken: PasswordResetTokenFactory(sequelize),
        Post: PostFactory(sequelize),
        PostComment: PostCommentFactory(sequelize),
        PostCustomAudience: PostCustomAudienceFactory(sequelize),
        PostFile: PostFileFactory(sequelize),
        ProfilePicture: ProfilePictureFactory(sequelize),
        Role: RoleFactory(sequelize),
        User: UserFactory(sequelize),
        UserBlock: UserBlockFactory(sequelize),
        UserConnection: UserConnectionFactory(sequelize),
        UserConnectionType: cache.init(UserConnectionTypeFactory(sequelize)),
        UserConnectionTypeJunction: UserConnectionTypeJunctionFactory(sequelize),
        UserJWT: UserJWTFactory(sequelize),
        UserRoleJunction: UserRoleJunctionFactory(sequelize),
        Views: {
            FeedView: FeedViewFactory(sequelize),
            UserConnectionView: UserConnectionViewFactory(sequelize)
        }
    };

    Object.values(db).forEach((model: any) => {
        if (model.associate) {
            model.associate(db.sequelize.models);
        }
    });

    Object.values(db.Views).forEach((model: any) => {
        if (model.associate) {
            model.associate(db.sequelize.models);
        }
    });

    return db;
};

export const db = createModels(sequelizeConfig);