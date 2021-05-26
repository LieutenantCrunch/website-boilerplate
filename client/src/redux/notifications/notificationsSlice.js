import { combineReducers } from 'redux';

import postsReducer from './postsSlice';

const notificationsReducer = combineReducers({
    posts: postsReducer
});

export default notificationsReducer;
