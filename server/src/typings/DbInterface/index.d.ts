import { Sequelize, Model, ModelCtor } from 'sequelize';

import { DisplayNameInstance } from '../../models/DisplayName';
import { PasswordResetTokenInstance } from '../../models/PasswordResetToken';
import { ProfilePictureInstance } from '../../models/ProfilePicture';
import { RoleInstance } from '../../models/Role';
import { UserInstance } from '../../models/User';
import { UserBlockInstance } from '../../models/UserBlock';
import { UserConnectionInstance } from '../../models/UserConnection';
import { UserConnectionTypeInstance } from '../../models/UserConnectionType';
import { UserConnectionTypeJunctionInstance } from '../../models/UserConnectionTypeJunction';
import { UserJWTInstance } from '../../models/UserJWT';
import { UserRoleJunctionInstance } from '../../models/UserRoleJunction';

// Views
import { FeedViewInstance } from '../../models/views/FeedView';
import { UserConnectionViewInstance } from '../../models/views/UserConnectionView';

export interface DbInterface {
  sequelize: Sequelize;
  DisplayName: ModelCtor<DisplayNameInstance>;
  PasswordResetToken: ModelCtor<PasswordResetTokenInstance>;
  ProfilePicture: ModelCtor<ProfilePictureInstance>;
  Role: ModelCtor<RoleInstance>;
  User: ModelCtor<UserInstance>;
  UserBlock: ModelCtor<UserBlockInstance>;
  UserConnection: ModelCtor<UserConnectionInstance>;
  UserConnectionType: ModelCtor<UserConnectionTypeInstance>;
  UserConnectionTypeJunction: ModelCtor<UserConnectionTypeJunctionInstance>;
  UserJWT: ModelCtor<UserJWTInstance>;
  UserRoleJunction: ModelCtor<UserRoleJunctionInstance>;
  Views: {
    FeedView: ModelCtor<FeedViewInstance>;
    UserConnectionView: ModelCtor<UserConnectionViewInstance>;
  }
}