import { createSlice, createEntityAdapter } from '@reduxjs/toolkit';

const commentsAdapter = createEntityAdapter({
    selectId: notification => notification.commentId,
    sortComparer: (a, b) => (b.postedOn - a.postedOn)
});
const initialState = commentsAdapter.getInitialState();

const commentsSlice = createSlice({
    name: 'comments',
    initialState,
    reducers: {
        addCommentNotification: commentsAdapter.addOne,
        removeCommentNotification: commentsAdapter.removeOne,
        removeAllCommentNotifications: commentsAdapter.removeAll
    }
});

export default commentsSlice.reducer;
export const { addCommentNotification, removeCommentNotification, removeAllCommentNotifications } = commentsSlice.actions;
const globalizedSelectors = commentsAdapter.getSelectors(state => state.notifications.comments);

// Selectors
export const selectAllCommentNotifications = globalizedSelectors.selectAll;
