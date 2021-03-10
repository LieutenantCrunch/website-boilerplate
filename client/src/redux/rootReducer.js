import { combineReducers } from 'redux';

import connectionsReducer from './connections/connectionsSlice';
import usersReducer from './users/usersSlice';

const rootReducer = combineReducers({
    connections: connectionsReducer,
    users: usersReducer
});

export default rootReducer;