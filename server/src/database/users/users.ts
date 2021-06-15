import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

import * as ClientConstants from '../../constants/constants.client';

import { models } from '../../models/_index';
import { UserInstance } from '../../models/User';

import { setUserDisplayName } from './sub/fields';

import * as _authorization from './sub/authorization';
import * as _blocking from './sub/blocking';
import * as _connections from './sub/connections';
import * as _fields from './sub/fields';
import * as _roles from './sub/roles';
import * as _searches from './sub/searches';

export const Authorization = _authorization;
export const Blocking = _blocking;
export const Connections = _connections;
export const Fields = _fields;
export const Roles = _roles;
export const Searches = _searches;

export const registerNewUser = async function(email: string, displayName: string, profileName: string, password: string): Promise<{id: string | null, success: Boolean}> {
    try
    {
        if (!displayName || displayName.length > 100 || displayName.indexOf('#') > -1) {
            return {id: null, success: false};
        }
        else if (!profileName || profileName.length > 20 || !ClientConstants.PROFILE_NAME_REGEX.test(profileName)) {
            return {id: null, success: false};
        }

        let salt: string = await bcrypt.genSalt(10);
        let passwordHash: string = await bcrypt.hash(password, salt);
        let uniqueId: string = uuidv4();

        let registeredUser: UserInstance | null = await models.User.create({
            email,
            passwordHash,
            uniqueId,
            profileName: profileName.toLowerCase()
        });

        if (registeredUser) {
            models.UserPreferences.create({
                registeredUserId: registeredUser.id!
            });

            let results: {success: Boolean, displayNameIndex?: number, message?: string} = await setUserDisplayName(uniqueId, displayName);

            return {id: uniqueId, success: results.success};
        }
    }
    catch (err)
    {
        console.error(`Error saving User to database: ${err.message}`);
    }

    return {id: null, success: false};
};
