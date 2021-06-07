import { Sequelize, Model, ModelCtor } from 'sequelize';

// Main Tables
import { DisplayNameInstance } from '../../models/DisplayName';
import { PasswordResetTokenInstance } from '../../models/PasswordResetToken';
import { PostInstance } from '../../models/PostFile';
import { PostCommentInstance } from '../../models/PostComment';
import { PostFileInstance } from '../../models/PostFile';
import { PostNotificationInstance } from '../../models/PostNotification';
import { ProfilePictureInstance } from '../../models/ProfilePicture';
import { RoleInstance } from '../../models/Role';
import { UserInstance } from '../../models/User';
import { UserBlockInstance } from '../../models/UserBlock';
import { UserConnectionInstance } from '../../models/UserConnection';
import { UserConnectionTypeInstance } from '../../models/UserConnectionType';
import { UserJWTInstance } from '../../models/UserJWT';
import { UserPreferencesInstance } from '../../models/UserPreferences';

// Junction Tables
import { PostCustomAudienceInstance } from '../../models/PostCustomAudience';
import { UserConnectionTypeJunctionInstance } from '../../models/UserConnectionTypeJunction';
import { UserRoleJunctionInstance } from '../../models/UserRoleJunction';

// Views
import { FeedViewInstance } from '../../models/views/FeedView';
import { UserConnectionViewInstance } from '../../models/views/UserConnectionView';

export interface DbInterface {
  sequelize: Sequelize;
  DisplayName: ModelCtor<DisplayNameInstance>;
  PasswordResetToken: ModelCtor<PasswordResetTokenInstance>;
  Post: ModelCtor<PostInstance>;
  PostComment: ModelCtor<PostCommentInstance>;
  PostCustomAudience: ModelCtor<PostCustomAudienceInstance>;
  PostFile: ModelCtor<PostFileInstance>;
  PostNotification: ModelCtor<PostNotificationInstance>;
  ProfilePicture: ModelCtor<ProfilePictureInstance>;
  Role: ModelCtor<RoleInstance>;
  User: ModelCtor<UserInstance>;
  UserBlock: ModelCtor<UserBlockInstance>;
  UserConnection: ModelCtor<UserConnectionInstance>;
  UserConnectionType: ModelCtor<UserConnectionTypeInstance>;
  UserConnectionTypeJunction: ModelCtor<UserConnectionTypeJunctionInstance>;
  UserJWT: ModelCtor<UserJWTInstance>;
  UserPreferences: ModelCtor<UserPreferencesInstance>;
  UserRoleJunction: ModelCtor<UserRoleJunctionInstance>;
  Views: {
    FeedView: ModelCtor<FeedViewInstance>;
    UserConnectionView: ModelCtor<UserConnectionViewInstance>;
  };
}