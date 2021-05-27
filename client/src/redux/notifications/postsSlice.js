import { createAsyncThunk, createSlice, createEntityAdapter } from '@reduxjs/toolkit';
import PostService from '../../services/post.service';
import * as Constants from '../../constants/constants';
import { isDashedGUID } from '../../utilities/TextUtilities';

const postsAdapter = createEntityAdapter({
    selectId: notification => notification.uniqueId,
    sortComparer: (a, b) => (b.postedOn - a.postedOn)
});
const initialState = postsAdapter.getInitialState({
    valid: false
});

// Async Thunks
export const fetchPostNotifications = createAsyncThunk('postNotifications/fetchPostNotifications', 
    async (arg, thunkAPI) => {
        const response = await PostService.getPostNotifications();
        return response;
    },
    {
        condition: (arg, { getState, extra }) => {
            let state = getState();

            if (selectPostNotificationsValid(state)) {
                return false;
            }
        }
    }
);

const postsSlice = createSlice({
    name: 'posts',
    initialState,
    reducers: {
        invalidatePostNotifications: (state, action) => {
            state.valid = false
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
                else if (entity.status === Constants.NOTIFICATION_STATUS.SEEN_ONCE) {
                    entity.status = Constants.NOTIFICATION_STATUS.UNREAD;
                }
            }
        },
        removePostNotification: (state, action) => {
            // If it's a dashed guid, then it's going to be the uniqueId, pass through
            if (isDashedGUID(action.payload)) {
                postsAdapter.removeOne(state, action.payload);
            }
            // else it's a postId, same logic as removePostNotifications
            else {
                let entityIds = Object.values(state.entities).reduce((foundIds, currentNotification) => {
                    if (currentNotification.postId === action.payload) {
                        foundIds.push(currentNotification.uniqueId);
                    }
    
                    return foundIds
                }, []);
    
                postsAdapter.removeMany(state, entityIds);
            }
        },
        removePostNotifications: (state, action) => {
            let entityIds = Object.values(state.entities).reduce((foundIds, currentNotification) => {
                if (currentNotification.postId === action.payload) {
                    foundIds.push(currentNotification.uniqueId);
                }

                return foundIds
            }, []);

            postsAdapter.removeMany(state, entityIds);
        },
        removeAllPostNotifications: postsAdapter.removeAll
    },
    extraReducers: {
        [fetchPostNotifications.pending]: (state, action) => {
            state.status = 'loading';
        },
        [fetchPostNotifications.fulfilled]: (state, action) => {
            state.status = 'idle';
            state.valid = true;
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
    invalidatePostNotifications,
    markAllPostNotificationsAsSeen,
    removePostNotification, 
    removePostNotifications, 
    removeAllPostNotifications 
} = postsSlice.actions;

const globalizedSelectors = postsAdapter.getSelectors(state => state.notifications.posts);
const { selectIds, selectById } = globalizedSelectors;

// Selectors
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

export const selectAllPostNotifications = globalizedSelectors.selectAll;
export const selectPostNotificationById = globalizedSelectors.selectById;
export const selectAllPostNotificationIds = globalizedSelectors.selectIds;
export const selectFetchPostNotificationsStatus = state => state.notifications.posts.status;
const selectPostNotificationsValid = state => state.notifications.posts.valid;

// Middleware
export const postsMiddleware = storeApi => next => action => {
    let { dispatch, getState } = storeApi;

    if (typeof action === 'function') {
        return action(dispatch, getState);
    }
    else {
        switch (action.type) {
            case markAllPostNotificationsAsSeen.toString(): {
                // Middleware happens before the actual action

                let { notifications } = getState();
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
