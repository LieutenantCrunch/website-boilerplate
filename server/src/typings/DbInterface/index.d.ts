import { Sequelize, Model, ModelCtor } from 'sequelize';

import { DisplayNameInstance } from '../../models/DisplayName';
import { PasswordResetTokenInstance } from '../../models/PasswordResetToken';
import { ProfilePictureInstance } from '../../models/ProfilePicture';
import { RoleInstance } from '../../models/Role';
import { UserInstance } from '../../models/User';
import { UserConnectionInstance } from '../../models/UserConnection';
import { UserConnectionTypeInstance } from '../../models/UserConnectionType';
import { UserConnectionTypeJunctionInstance } from '../../models/UserConnectionTypeJunction';
import { UserJWTInstance } from '../../models/UserJWT';
import { UserRoleJunctionInstance } from '../../models/UserRoleJunction';
import { UserConnectionViewInstance } from '../../models/views/UserConnectionView';

export interface DbInterface {
  sequelize: Sequelize;
  DisplayName: ModelCtor<DisplayNameInstance>;
  PasswordResetToken: ModelCtor<PasswordResetTokenInstance>;
  ProfilePicture: ModelCtor<ProfilePictureInstance>;
  Role: ModelCtor<RoleInstance>;
  User: ModelCtor<UserInstance>;
  UserConnection: ModelCtor<UserConnectionInstance>;
  UserConnectionType: ModelCtor<UserConnectionTypeInstance>;
  UserConnectionTypeJunction: ModelCtor<UserConnectionTypeJunctionInstance>;
  UserJWT: ModelCtor<UserJWTInstance>;
  UserRoleJunction: ModelCtor<UserRoleJunctionInstance>;
  Views: {
    UserConnectionView: ModelCtor<UserConnectionViewInstance>;
  }
}