import memoize from 'memoizee';

import { models } from '../../../models/_index';
import { UserInstance } from '../../../models/User';

import { getUserIdForUniqueId } from './fields';

const _checkUserForRole = async function(uniqueId: string | number | undefined, roleName: string): Promise<Boolean> {
    try
    {
        if (uniqueId) {
            let id: number | undefined = undefined;

            if (typeof uniqueId === 'string') {
                id = await getUserIdForUniqueId(uniqueId);
            }
            else {
                id = uniqueId;
            }

            if (id) {
                let registeredUser: UserInstance | null = await models.User.findOne({
                    attributes: [
                        'id'
                    ],
                    where: {
                        id
                    },
                    include: {
                        model: models.Role,
                        as: 'roles',
                        required: true,
                        attributes: [
                            'id'
                        ],
                        where: {
                            roleName
                        }
                    }
                });

                if (registeredUser) {
                    return true;
                }
            }
        }
    }
    catch (err) {
        console.error(`Error checking role (${roleName}) for user ${uniqueId}:\n${err.message}`);
    }

    return false;
}

// ##TODO: Will need to invalidate this once the ability to add and remove roles is implemented
export const checkUserForRole = memoize(_checkUserForRole, {
    promise: true
});
