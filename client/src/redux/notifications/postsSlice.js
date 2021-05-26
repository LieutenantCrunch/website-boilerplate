import { createAsyncThunk, createSlice, createEntityAdapter } from '@reduxjs/toolkit';
import { seenPostNotifications } from '../users/currentUserSlice';
import PostService from '../../services/post.service';
import * as Constants from '../../constants/constants';

const postsAdapter = createEntityAdapter({
    selectId: notification => notification.uniqueId,
    sortComparer: (a, b) => (b.postedOn - a.postedOn)
});
const initialState = postsAdapter.getInitialState();

// Async Thunks
export const fetchPostNotifications = createAsyncThunk('postNotifications/fetchPostNotifications', async () => {
    const response = await PostService.getPostNotifications();
    return response;
});

const postsSlice = createSlice({
    name: 'posts',
    initialState,
    reducers: {
        /*addPostNotification: postsAdapter.addOne,*/
        addPostNotification: (state, action) => {
            let newPostNotification = action.payload;
            let merged = false;

            // First try to find any existing notifications for the same post
            let existingPostNotifications = Object.values(state.entities).reduce((foundNotifications, currentNotification) => {
                if (currentNotification.postId === newPostNotification.postId && currentNotification.type === newPostNotification.type) {
                    foundNotifications.push(currentNotification);
                }

                return foundNotifications
            }, []);

            // If there are existing post notifications for this particular post with the same type
            if (existingPostNotifications.length > 0) {
                // Then check if there are any unseen notifications we can merge this with
                let mergeNotification = existingPostNotifications.find(notification => notification.status === Constants.NOTIFICATION_STATUS.UNSEEN);

                // If we found one
                if (mergeNotification) {
                    let mergeTriggeredBy = [
                        ...mergeNotification.triggeredBy
                    ];

                    // Make sure we only merge in new users
                    for (let user of newPostNotification.triggeredBy) {
                        if (!mergeTriggeredBy.find(test => test === user)) {
                            mergeTriggeredBy.push(user);
                        }
                    }

                    // Merge this one in
                    let updatedNotification = {
                        ...mergeNotification,
                        triggeredBy: mergeTriggeredBy
                    };

                    postsAdapter.upsertOne(state, updatedNotification);
                    merged = true;
                }
            }

            // If we failed to merge, just add the notification like normal
            if (!merged) {
                postsAdapter.addOne(state, newPostNotification);
            }
        },
        addPostNotifications: (state, action) => {
            let newPostNotifications = action.payload;
            let addList = [];
            let upsertList = [];

            for (let newPostNotification of newPostNotifications) {
                let merged = false;

                // First try to find any existing notifications for the same post
                let existingPostNotifications = Object.values(state.entities).reduce((foundNotifications, currentNotification) => {
                    if (currentNotification.postId === newPostNotification.postId && currentNotification.type === newPostNotification.type) {
                        foundNotifications.push(currentNotification);
                    }

                    return foundNotifications
                }, []);

                // If there are existing post notifications for this particular post with the same type
                if (existingPostNotifications.length > 0) {
                    // Then check if there are any unseen notifications we can merge this with
                    let mergeNotification = existingPostNotifications.find(notification => notification.status === Constants.NOTIFICATION_STATUS.UNSEEN);

                    // If we found one
                    if (mergeNotification) {
                        let mergeTriggeredBy = [
                            ...mergeNotification.triggeredBy
                        ];

                        // Make sure we only merge in new users
                        for (let user of newPostNotification.triggeredBy) {
                            if (!mergeTriggeredBy.find(test => test === user)) {
                                mergeTriggeredBy.push(user);
                            }
                        }

                        // Merge this one in
                        let updatedNotification = {
                            ...mergeNotification,
                            triggeredBy: mergeTriggeredBy
                        };

                        upsertList.push(updatedNotification);
                        merged = true;
                    }
                }

                // If we failed to merge, just add the notification like normal
                if (!merged) {
                    addList.push(newPostNotification);
                }
            }

            if (addList.length > 0) {
                postsAdapter.addMany(state, addList);
            }

            if (upsertList.length > 0) {
                postsAdapter.upsertMany(state, upsertList);
            }
        },
        markAllPostNotificationsAsSeen: (state, action) => {
            for (let id of state.ids) {
                let entity = state.entities[id];

                // We only need to mark the unseen notifications as seen once
                // The middleware will inform the server that the notifications were seen,
                // so the next time they're fetched they'll come down with the new statuses.
                if (entity.status === Constants.NOTIFICATION_STATUS.UNSEEN) {
                    entity.status = Constants.NOTIFICATION_STATUS.SEEN_ONCE;
                }
            }
        },
        removePostNotification: postsAdapter.removeOne,
        removeAllPostNotifications: postsAdapter.removeAll
    },
    extraReducers: {
        [fetchPostNotifications.pending]: (state, action) => {
            state.status = 'loading';
        },
        [fetchPostNotifications.fulfilled]: (state, action) => {
            state.status = 'idle';
            postsAdapter.removeAll(state);
            postsAdapter.addMany(state, action.payload);
        },
        [fetchPostNotifications.rejected]: (state, action) => {
            state.status = 'failed';
            state.error = action.error.message;
        }
    }
});

export default postsSlice.reducer;
export const { 
    addPostNotification, 
    addPostNotifications,
    markAllPostNotificationsAsSeen,
    removePostNotification, 
    removeAllPostNotifications 
} = postsSlice.actions;

const globalizedSelectors = postsAdapter.getSelectors(state => state.notifications.posts);
const { selectIds, selectById } = globalizedSelectors;

// Selectors
// Supposedly you can create a selector that will handle two things, but the Redux documentation is crap, so oh well
// https://redux.js.org/tutorials/fundamentals/part-8-modern-redux selectFilteredTodos
const selectPostNotificationsWithStatus = (state, status) => {
    let ids = selectIds(state);

    return ids.reduce((results, id) => {
        let entity = selectById(state, id);

        if (entity.status === status) {
            results.push(entity);
        }

        return results;
    }, []);
};

export const selectUnseenPostNotifications = state => {
    return selectPostNotificationsWithStatus(state, Constants.NOTIFICATION_STATUS.UNSEEN);
};

export const selectSeenOncePostNotifications = state => {
    return selectPostNotificationsWithStatus(state, Constants.NOTIFICATION_STATUS.SEEN_ONCE);
};

export const selectUnreadPostNotifications = state => {
    return selectPostNotificationsWithStatus(state, Constants.NOTIFICATION_STATUS.UNREAD);
};

export const selectReadPostNotifications = state => {
    return selectPostNotificationsWithStatus(state, Constants.NOTIFICATION_STATUS.READ);
};

export const selectAllPostNotifications = globalizedSelectors.selectAll;
export const selectFetchPostNotificationsStatus = state => state.notifications.posts.status;

// Middleware
export const postsMiddleware = storeApi => next => action => {
    let { dispatch, getState } = storeApi;

    if (typeof action === 'function') {
        return action(dispatch, getState);
    }
    else {
        switch (action.type) {
            case markAllPostNotificationsAsSeen.toString(): {
                let { currentUser, notifications } = getState();

                // Only update the current user if there are unseenPostNotifications
                if (currentUser.unseenPostNotifications) {
                    dispatch(seenPostNotifications());
                }

                let { posts } = notifications;
                let { ids, entities } = posts;

                // Only make a call to the server if there are unseen or seen once notifications
                for (let id of ids) {
                    if (entities[id].status > Constants.NOTIFICATION_STATUS.UNREAD) {
                        PostService.markAllPostNotificationsAsSeen();
                        break;
                    }
                }

                break;
            }
            default:
                break;
        }

        return next(action);
    }
};
