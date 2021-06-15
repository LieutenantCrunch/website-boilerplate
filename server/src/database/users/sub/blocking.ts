import memoize from 'memoizee';

import { models } from '../../../models/_index';
import { UserBlockInstance } from '../../../models/UserBlock';
import { UserInstance } from '../../../models/User';

import { getUserIdForUniqueId } from './fields';
import { checkUserForRole } from './roles';
import { getUserWithUniqueId } from './searches';

export const blockUser = async function(currentUserUniqueId: string, blockUserUniqueId: string): Promise<Boolean> {
    try {
        let currentUser: UserInstance | null = await getUserWithUniqueId(currentUserUniqueId);
        let blockedUser: UserInstance | null = await getUserWithUniqueId(blockUserUniqueId);

        if (currentUser && blockedUser) {
            await currentUser.addBlockedUser(blockedUser);

            // Invalidate the cache for all possible calls with the two users since the result will have changed
            checkIfFirstUserIsBlockingSecond.delete(currentUser.id!, blockedUser.id!);
            checkIfFirstUserIsBlockingSecond.delete(currentUser.uniqueId!, blockedUser.id!);
            checkIfFirstUserIsBlockingSecond.delete(currentUser.id!, blockedUser.uniqueId!);
            checkIfFirstUserIsBlockingSecond.delete(currentUser.uniqueId!, blockedUser.uniqueId!);

            return true;
        }
    }
    catch (err) {
        console.error(`Error blocking user with unique id [${blockUserUniqueId}] for user with unique id [${currentUserUniqueId}]:\n${err.message}`);
    }

    return false;
}

const _checkIfFirstUserIsBlockingSecond = async function(firstId: string | number, secondId: string | number): Promise<Boolean> {
    let actualFirstId: number | undefined = undefined;
    let actualSecondId: number | undefined = undefined;

    if (typeof secondId === 'string') {
        actualSecondId = await getUserIdForUniqueId(secondId);
    }
    else {
        actualSecondId = secondId;
    }

    if (await checkUserForRole(actualSecondId, 'Administrator')) {
        return false;
    }
    
    if (typeof firstId === 'string') {
        actualFirstId = await getUserIdForUniqueId(firstId);
    }
    else {
        actualFirstId = firstId;
    }

    if (actualFirstId !== undefined && actualSecondId !== undefined) {
        let results: UserBlockInstance | null = await models.UserBlock.findOne({
            where: {
                registeredUserId: actualFirstId,
                blockedUserId: actualSecondId
            }
        });

        if (results) {
            return true;
        }
    }

    return false;
}

export const checkIfFirstUserIsBlockingSecond = memoize(_checkIfFirstUserIsBlockingSecond, {
    promise: true
});

export const unblockUser = async function(currentUserUniqueId: string, unblockUserUniqueId: string): Promise<Boolean> {
    try {
        let currentUser: UserInstance | null = await getUserWithUniqueId(currentUserUniqueId);
        let blockedUser: UserInstance | null = await getUserWithUniqueId(unblockUserUniqueId);

        if (currentUser && blockedUser) {
            await currentUser.removeBlockedUser(blockedUser);

            // Invalidate the cache for all possible calls with the two users since the result will have changed
            checkIfFirstUserIsBlockingSecond.delete(currentUser.id!, blockedUser.id!);
            checkIfFirstUserIsBlockingSecond.delete(currentUser.uniqueId!, blockedUser.id!);
            checkIfFirstUserIsBlockingSecond.delete(currentUser.id!, blockedUser.uniqueId!);
            checkIfFirstUserIsBlockingSecond.delete(currentUser.uniqueId!, blockedUser.uniqueId!);

            return true;
        }
    }
    catch (err) {
        console.error(`Error unblocking user with unique id [${unblockUserUniqueId}] for user with unique id [${currentUserUniqueId}]:\n${err.message}`);
    }

    return false;
}
