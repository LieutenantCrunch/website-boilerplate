import { configureStore } from '@reduxjs/toolkit';
import outgoingConnectionsReducer from './connections/outgoingConnectionsSlice';
import incomingConnectionsReducer from './connections/incomingConnectionsSlice';

export default configureStore({
    reducer: {
        outgoingConnections: outgoingConnectionsReducer,
        incomingConnections: incomingConnectionsReducer
    }
});