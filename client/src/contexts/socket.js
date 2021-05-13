import { createContext } from 'react';
import socketIO from 'socket.io-client';
import * as Constants from '../constants/constants';

export const socket = socketIO({
    autoConnect: false,
    reconnectionAttempts: 10,
    reconnectionDelay: 5000,
    transports: ['websocket']
});

socket.on('connect_error', (err) => {
    console.error(`Socket connect error:\n${err.message}`);
});

export const SocketContext = createContext();
