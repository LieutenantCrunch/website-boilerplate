import { combineReducers } from 'redux';

import commentsReducer from './commentsSlice';

const notificationsReducer = combineReducers({
    comments: commentsReducer
});

export default notificationsReducer;
