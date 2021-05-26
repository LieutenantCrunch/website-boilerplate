import { combineReducers } from 'redux';

import connectionsReducer from './connections/connectionsSlice';
import currentUserReducer from './users/currentUserSlice';
import notificationsReducer from './notifications/notificationsSlice';
import { selectUnseenPostNotifications } from './notifications/postsSlice';
import usersReducer from './users/usersSlice';

import * as Constants from '../constants/constants';

const appReducer = combineReducers({
    connections: connectionsReducer,
    currentUser: currentUserReducer,
    notifications: notificationsReducer,
    users: usersReducer
});

// https://stackoverflow.com/questions/35622588/how-to-reset-the-state-of-a-redux-store
const rootReducer = (state, action) => {
    if (action.type === 'global/logout') {
        state = undefined;
    }

    return appReducer(state, action);
}

export default rootReducer;
export const reduxLogout = () => ({
    type: 'global/logout',
    payload: undefined
});

// Selectors
export const selectUnseenPostNotificationCount = state => {
    let unseenPostNotifications = state.currentUser?.unseenPostNotifications;

    if (unseenPostNotifications) {
        return unseenPostNotifications;
    }

    let postNotifications = selectUnseenPostNotifications(state);

    return postNotifications.length;
}
