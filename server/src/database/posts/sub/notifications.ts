import { Op } from 'sequelize';
import { Sequelize } from 'sequelize';

import * as ClientConstants from '../../../constants/constants.client';
import { adjustGUIDDashes } from '../../../utilities/utilityFunctions';
import { notificationHelper } from '../../../utilities/notificationHelper';

import { models } from '../../../models/_index';
import { PostNotificationInstance } from '../../../models/PostNotification';
import { UserInstance } from '../../../models/User';

import { getUserIdForUniqueId } from '../../users/sub/fields';
import { getUserWithUniqueId } from '../../users/sub/searches';

export const getPostNotifications = async function(uniqueId: string): Promise<WebsiteBoilerplate.PostNotification[]> {
    let notifications: WebsiteBoilerplate.PostNotification[] = [];

    try {
        let registeredUser: UserInstance | null = await getUserWithUniqueId(uniqueId);

        if (registeredUser) {
            let postNotifications: PostNotificationInstance[] = await registeredUser.getPostNotifications({
                include: [
                    {
                        model: models.User,
                        as: 'triggeredByUser',
                        attributes: [
                            'id'
                        ],
                        include: [
                            {
                                model: models.DisplayName,
                                as: 'displayNames',
                                where: {
                                    isActive: true
                                },
                                attributes: [
                                    'displayName',
                                    'displayNameIndex'
                                ]
                            }
                        ]
                    },
                    {
                        model: models.Post,
                        as: 'post',
                        attributes: [
                            'postTitle',
                            'uniqueId'
                        ]
                    },
                    {
                        model: models.PostComment,
                        as: 'comment',
                        required: false,
                        attributes: [
                            'uniqueId'
                        ]
                    }
                ],
                // Order ascending:
                // If one user triggers multiple notifications for the same post, there will still only be one
                // notification after they're processed. Because there will only be one notification for a single user,
                // it will include the commentId in the notification. We want the commentId to be the oldest comment
                // by the user, so by ordering ascending, the first comment to be hit and stored will be the oldest one.
                // The notifications will then get sorted by date descending, making sure they end in the right order.
                order: [['id', 'ASC']]
            });

            if (postNotifications.length > 0) {
                let { postNotifications: filteredNotifications, purgeNotifications }: { postNotifications: WebsiteBoilerplate.PostNotification[], purgeNotifications: PostNotificationInstance[] } = notificationHelper.processPostNotifications(postNotifications);

                notifications = filteredNotifications;

                if (purgeNotifications.length > 0) {
                    models.PostNotification.destroy({
                        where: {
                            id: purgeNotifications.map(notification => notification.id!)
                        }
                    });
                }
            }
        }
    }
    catch (err) {
        console.error(`Error getting post notifications for user ${uniqueId}:\n${err.message}`);
    }

    return notifications;
}

export const markAllPostNotificationsAsSeen = async function(uniqueId: string, endDate: Date | undefined) {
    try {
        let registeredUserId: number | undefined = await getUserIdForUniqueId(uniqueId);

        if (registeredUserId) {
            let whereOptions: { [key: string]: any} = {
                registeredUserId,
                notificationStatus: ClientConstants.NOTIFICATION_STATUS.SEEN_ONCE,
            };

            if (endDate) {
                whereOptions.createdOn = {
                    [Op.lte]: endDate
                };
            }

            // Mark all that they've seen at least once before as Unread
            // Need to wait so we don't accidentally update the same notification twice
            await models.PostNotification.update({
                    notificationStatus: ClientConstants.NOTIFICATION_STATUS.UNREAD
                },
                {
                    where: whereOptions
                }
            );

            whereOptions.notificationStatus = ClientConstants.NOTIFICATION_STATUS.UNSEEN;

            // Mark all that they haven't seen as Seen Once
            // Don't need to wait
            models.PostNotification.update({
                    notificationStatus: ClientConstants.NOTIFICATION_STATUS.SEEN_ONCE
                },
                {
                    where: whereOptions
                }
            );
        }
    }
    catch (err) {
        console.error(`Error marking unseen notifications as seen/unread:\n${err.message}`);
    }
}

export const markPostNotificationsAsRead = async function(uniqueId: string, postId: string, endDate: Date | undefined) {
    try {
        let registeredUserId: number | undefined = await getUserIdForUniqueId(uniqueId);

        if (registeredUserId) {
            let adjustedPostId: string | undefined = adjustGUIDDashes(postId, true);

            if (adjustedPostId) {
                let whereOptions: { [key: string]: any} = {
                    postId: {
                        [Op.eq]: Sequelize.literal(`(select \`id\` FROM \`post\` where \`post\`.\`unique_id\` = '${adjustedPostId}')`)
                    },
                    registeredUserId,
                    notificationStatus: {
                        [Op.ne]: ClientConstants.NOTIFICATION_STATUS.READ /* Knock out unseen and unread at the same time */
                    }
                };
                
                if (endDate) {
                    whereOptions.createdOn = {
                        [Op.lte]: endDate
                    };
                }

                // Don't need to wait
                models.PostNotification.update({
                        notificationStatus: ClientConstants.NOTIFICATION_STATUS.READ
                    },
                    {
                        where: whereOptions
                    }
                );
            }
        }
    }
    catch (err) {
        console.error(`Error marking unseen notifications as read:\n${err.message}`);
    }
}

export const removeAllPostNotifications = async function(uniqueId: string, endDate: Date | undefined) {
    try {
        let registeredUserId: number | undefined = await getUserIdForUniqueId(uniqueId);

        if (registeredUserId) {
            let whereOptions: { [key: string]: any} = {
                registeredUserId
            };

            if (endDate) {
                whereOptions.createdOn = {
                    [Op.lte]: endDate
                };
            }

            await models.PostNotification.destroy({
                where: whereOptions
            });
        }
    }
    catch (err) {
        console.error(`Error removing all notifications:\n${err.message}`);
    }
}

export const removePostNotifications = async function(uniqueId: string, postId: string, endDate: Date | undefined) {
    try {
        let registeredUserId: number | undefined = await getUserIdForUniqueId(uniqueId);

        if (registeredUserId) {
            let adjustedPostId: string | undefined = adjustGUIDDashes(postId, true);

            if (adjustedPostId) {
                let whereOptions: { [key: string]: any} = {
                    postId: {
                        [Op.eq]: Sequelize.literal(`(select \`id\` FROM \`post\` where \`post\`.\`unique_id\` = '${adjustedPostId}')`)
                    },
                    registeredUserId
                };

                if (endDate) {
                    whereOptions.createdOn = {
                        [Op.lte]: endDate
                    };
                }

                await models.PostNotification.destroy({
                    where: whereOptions
                });
            }
        }
    }
    catch (err) {
        console.error(`Error removing notifications:\n${err.message}`);
    }
}
