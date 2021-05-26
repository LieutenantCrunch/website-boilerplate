import { v4 as uuidv4 } from 'uuid';
import { DisplayNameInstance } from '../models/DisplayName';
import { PostNotificationInstance } from '../models/PostNotification';
import { UserInstance } from '../models/User';
import { adjustGUIDDashes } from './utilityFunctions';
import * as ClientConstants from '../constants/constants.client';
import * as ServerConstants from '../constants/constants.server';

// These interfaces are just for use in this file, do not export
interface _NotificationDetails {
    displayName: string;
    commentId: string | undefined;
    createdOn: Date;
    postTitle: string | undefined;
    type: number;
    status: number;
};

interface _NotificationGroup {
    [postId: string]: _NotificationDetails[];
};

class NotificationHelper {
    processPostNotifications (notifications: PostNotificationInstance[]): { postNotifications: WebsiteBoilerplate.PostNotification[], purgeNotifications: PostNotificationInstance[] } {
        let postNotifications: WebsiteBoilerplate.PostNotification[] = [];
        let purgeNotifications: PostNotificationInstance[] = [];

        try
        {
            // UI
            // When initially fetching the user details with getUserDetails, it pulls down the count of unseen notifications.
            // These unseen notifications are not loaded into the UI initially.
            // They click the notification button, upon which two things should happen:
            //      1: It will fetch the list of notifications and display them
            //      2: It should mark all unseen notifications as seen once and all seen notifications as unread
            // The order of these two things may not be guaranteed
            // When the menu pops up, the user should see the following:
            //      Unseen / Seen Once Notifications with a green background
            //      Unread Notifications with a blue background
            //      Read Notifications with a transparent background
            // Thus, we have to filter all notifications into three groups:
            let tempDict: {
                unseen: _NotificationGroup;
                unread: _NotificationGroup;
                read: _NotificationGroup;
            } = {
                unseen: {},
                unread: {},
                read: {}
            };

            // Calculate the cutoff date for old notifications that will be purged
            let cutoffDate = (new Date(Date.now())).addDays(-ServerConstants.READ_NOTIFICATION_EXPIRATION_DAYS); // Two weeks

            // Process all notifications
            for (let notification of notifications) {
                // First, get the status of the notification
                let notificationStatus: number = notification.notificationStatus!;

                // If the notification has been read and it's older than 2 weeks
                if (notificationStatus === ClientConstants.NOTIFICATION_STATUS.READ && notification.createdOn < cutoffDate) {
                    // Add it to the purge list
                    purgeNotifications.push(notification);
                }
                // Otherwise, proceed with filtering
                else {
                    // There should be a triggeredByUser
                    let triggeredByUser: UserInstance | undefined = notification.triggeredByUser;

                    if (triggeredByUser) {
                        // Get the display name that will appear to the user, taking index 0 into account
                        let displayNames: DisplayNameInstance[] = triggeredByUser.displayNames!;
                        let displayName: DisplayNameInstance = displayNames[0];
                        let fullDisplayName: string = displayName.displayName;
                        
                        if (displayName.displayNameIndex !== 0) {
                            fullDisplayName += `#${displayName.displayNameIndex}`;
                        }

                        // Get various values that will display in the notification
                        let postId: string = notification.post!.uniqueId;
                        let postTitle: string | undefined = notification.post!.postTitle || undefined;

                        let currentValue: _NotificationDetails[] | undefined = undefined;

                        // Check the dictionary to see if there's an entry for this post
                        // Technically, I could switch off adjustedStatus from below, but I'll leave it like this for now
                        switch (notificationStatus) {
                            case ClientConstants.NOTIFICATION_STATUS.UNSEEN:
                            case ClientConstants.NOTIFICATION_STATUS.SEEN_ONCE:
                                // Unseen and Seen Once are grouped together
                                currentValue = tempDict.unseen[postId];
                                break;
                            case ClientConstants.NOTIFICATION_STATUS.UNREAD:
                                currentValue = tempDict.unread[postId];
                                break;
                            case ClientConstants.NOTIFICATION_STATUS.READ:
                            default:
                                // Read is the 0 value, so it's also the default status
                                currentValue = tempDict.read[postId];
                                break;
                        }

                        // Fill out the notification details that will be used to display the notification on the client
                        let details: _NotificationDetails = {
                            displayName: fullDisplayName,
                            commentId: notification.comment ? adjustGUIDDashes(notification.comment.uniqueId) : undefined,
                            createdOn: notification.createdOn,
                            postTitle,
                            status: notificationStatus,
                            type: notification.notificationType
                        };

                        // If there's already an entry in the dictionary for this post id
                        if (currentValue) {
                            // Check to see if there's an entry for the current user
                            let existingEntry: _NotificationDetails | undefined = currentValue.find(value => value.displayName === fullDisplayName);
                            
                            if (!existingEntry) {
                                // If there isn't already an entry for this user, add it to the list
                                currentValue.push(details);
                            }
                            // Otherwise, check to see if we need to update the entry at all
                            else {
                                // Check to see if the createdOn value of this new notification is newer than the existing one
                                if (notification.createdOn > existingEntry.createdOn) {
                                    // And if so, update the existing entry
                                    existingEntry.createdOn = notification.createdOn;

                                    // This will allow us to clear all notifications before a certain date later on
                                }

                                // Check to see if the status of this new notification is unseen and the current entry is seen once
                                if (notificationStatus === ClientConstants.NOTIFICATION_STATUS.UNSEEN && existingEntry.status === ClientConstants.NOTIFICATION_STATUS.SEEN_ONCE) {
                                    // And if so, elevate the status back to unseen when sending down to the client
                                    existingEntry.status = ClientConstants.NOTIFICATION_STATUS.UNSEEN;
                                }
                            }
                        }
                        // Else create a new entry
                        else {
                            switch (notificationStatus) {
                                case ClientConstants.NOTIFICATION_STATUS.UNSEEN:
                                case ClientConstants.NOTIFICATION_STATUS.SEEN_ONCE:
                                    // Unseen and Seen Once are grouped together
                                    tempDict.unseen[postId] = [details];
                                    break;
                                case ClientConstants.NOTIFICATION_STATUS.UNREAD:
                                    tempDict.unread[postId] = [details];
                                    break;
                                case ClientConstants.NOTIFICATION_STATUS.READ:
                                default:
                                    // Read is the 0 value, so it's also the default status
                                    tempDict.read[postId] = [details];
                                    break;
                            }
                        }
                    }
                }
            }

            // At this point, we've filtered all of the notifications into the three groups and made sure there's only one entry per user.
            // Now we need to go through and build up the actual notifications that will go down to the client

            // This will be unseen, unread, and read
            let tempDictKeys: string[] = Object.keys(tempDict);

            // Loop through the three groups
            for (let topLevelKeyName of tempDictKeys) {
                let topLevelKey: keyof typeof tempDict = topLevelKeyName as keyof typeof tempDict;
                let group: _NotificationGroup = tempDict[topLevelKey];
                let keys: string[] = Object.keys(group);

                // Loop through the keys (postIds) and build combined notifications
                for (let key of keys) {
                    let values: _NotificationDetails[] = group[key];

                    if (values.length > 0) {
                        // Base the notification off the first value
                        let firstValue: _NotificationDetails = values[0];

                        let message: string = '';

                        switch (firstValue.type) {
                            case ClientConstants.NOTIFICATION_TYPES.COMMENT:
                                message = `commented on ${firstValue.postTitle || 'your post'}`;
                                break;
                            case ClientConstants.NOTIFICATION_TYPES.COMMENT_REPLY:
                                message = `replied to your comment`;
                                break;
                            default:
                                message = 'New Notification';
                                break;
                        }

                        // Create the notification with initial values
                        let notification: WebsiteBoilerplate.PostNotification = {
                            postId: adjustGUIDDashes(key)!,
                            createdOn: firstValue.createdOn,
                            message,
                            status: firstValue.status,
                            type: firstValue.type,
                            uniqueId: uuidv4()
                        };

                        notification.triggeredBy = values.map(value => value.displayName);

                        if (values.length === 1) {
                            // Only one user commented on the post, we can link to the specific comment
                            notification.commentId = firstValue.commentId;
                        }

                        // Add it to the list
                        postNotifications.push(notification);
                    }
                }
            }

            // Sort the notifications by Unseen > Unread > Read
            postNotifications.sort((a, b) => {
                // Read is the lowest status at 0
                // Unseen is the highest status at 2
                if (a.status > b.status) { // Ex: A = Unseen, B = Read
                    return -1;
                }
                else if (a.status < b.status) { // Ex: A = Read, B = Unseen
                    return 1;
                }
                else { // (a.status == b.status) // Ex: A = Unread, B = Unread
                    if (a.createdOn > b.createdOn) { // If A is more recent than B
                        return -1;
                    }
                    else if (a.createdOn < b.createdOn) { // If B is more recent than A
                        return 1;
                    }
                    else { // (a.createdOn === b.createdOn) // If A is the same as B
                        return 0;
                    }
                }
            });
        }
        catch (err) {
            console.error(`Error processing notifications for user\n${err.message}`);
        }

        return { postNotifications, purgeNotifications };
    }
}

export const notificationHelper: NotificationHelper = new NotificationHelper();
