import { configureStore } from '@reduxjs/toolkit';
import connectionsReducer from './connections/connectionsSlice';
import { myMiddleware } from './connections/connectionsSlice';

const store = configureStore({
    reducer: connectionsReducer,
    middleware: [
        myMiddleware
    ]
});

export default store;