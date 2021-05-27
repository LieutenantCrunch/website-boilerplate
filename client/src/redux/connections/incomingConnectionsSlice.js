import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import UserService from '../../services/user.service';

const initialState = {
    ids: [],
    status: 'idle',
    error: null
};

// Async Thunks
export const fetchIncomingConnections = createAsyncThunk('incomingConnections/fetchIncomingConnections', async () => {
    const response = await UserService.getIncomingConnections();
    return response;
});

const incomingConnectionsSlice = createSlice({
    name: 'incomingConnections',
    initialState,
    reducers: {
        incomingConnectionAdded(state, action) {
            state.ids.push(action.payload);
        },
        incomingConnectionRemoved(state, action) {
            let uniqueId = action.payload;
            let removeIndex = state.ids.findIndex(id => id === uniqueId);

            if (removeIndex > -1) {
                state.ids.splice(removeIndex, 1);
            }
        }
    },
    extraReducers: {
        [fetchIncomingConnections.pending]: (state, action) => {
            state.status = 'loading';
        },
        [fetchIncomingConnections.fulfilled]: (state, action) => {
            state.status = 'idle';
            state.ids = action.payload;
        },
        [fetchIncomingConnections.rejected]: (state, action) => {
            state.status = 'failed';
            state.error = action.error.message;
        }
    }
});

export default incomingConnectionsSlice.reducer;
export const { incomingConnectionAdded, incomingConnectionRemoved } = incomingConnectionsSlice.actions;

// Selectors
export const selectIncomingConnectionIds = state => state.connections.incomingConnections.ids;
export const selectIncomingConnectionsStatus = state => state.connections.incomingConnections.status;
