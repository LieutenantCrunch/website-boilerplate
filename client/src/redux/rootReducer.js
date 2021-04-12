import { combineReducers } from 'redux';

import connectionsReducer from './connections/connectionsSlice';
import currentUserReducer from './users/currentUserSlice';
import usersReducer from './users/usersSlice';

const appReducer = combineReducers({
    connections: connectionsReducer,
    currentUser: currentUserReducer,
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