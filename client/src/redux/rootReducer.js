import { combineReducers } from 'redux';

import connectionsReducer from './connections/connectionsSlice';
import currentUserReducer from './users/currentUserSlice';
import usersReducer from './users/usersSlice';

const rootReducer = combineReducers({
    connections: connectionsReducer,
    currentUser: currentUserReducer,
    users: usersReducer
});

export default rootReducer;