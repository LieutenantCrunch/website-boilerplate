import { configureStore } from '@reduxjs/toolkit';
import outgoingConnectionsReducer from './connections/outgoingConnectionsSlice';

export default configureStore({
    reducer: {
        outgoingConnections: outgoingConnectionsReducer
    }
});