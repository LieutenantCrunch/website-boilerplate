import socketIO from 'socket.io-client';
import * as Constants from '../constants/constants';
import store from '../redux/store';
import { invalidatePostNotifications } from '../redux/notifications/postsSlice';
import { unseenPostNotificationAdded } from '../redux/users/currentUserSlice';

export const socket = socketIO({
    autoConnect: false,
    reconnectionAttempts: 10,
    reconnectionDelay: 5000,
    transports: ['websocket']
});

export const connectSocket = () => {
    socket.on('connect_error', (err) => {
        console.error(`Socket connect error:\n${err.message}`);
    });
    
    socket.on(Constants.SOCKET_EVENTS.NOTIFY_USER.NEW_COMMENT, () => {
        // Mark the current user as having unseen post notifications
        store.dispatch(unseenPostNotificationAdded());
    
        // Invalidate the current post notifications so they are fetched from the server the next time a fetch is called
        store.dispatch(invalidatePostNotifications());
    });

    socket.connect();
};

export const disconnectSocket = () => {
    socket.disconnect();
    socket.off('connect_error');
    socket.off(Constants.SOCKET_EVENTS.NOTIFY_USER.NEW_COMMENT);
};
