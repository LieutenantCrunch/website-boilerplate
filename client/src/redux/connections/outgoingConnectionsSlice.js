import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import UserService from '../../services/user.service';

const initialState = {
    ids: [],
    status: 'idle',
    error: null
};

// Async Thunks
export const fetchOutgoingConnections = createAsyncThunk('outgoingConnections/fetchOutgoingConnections', async () => {
    const response = await UserService.getOutgoingConnections();
    return response;
});

const outgoingConnectionsSlice = createSlice({
    name: 'outgoingConnections',
    initialState,
    reducers: {
        outgoingConnectionAdded(state, action) {
            state.ids.push(action.payload);
        },
        outgoingConnectionRemoved(state, action) {
            let uniqueId = action.payload;
            let removeIndex = state.ids.findIndex(id => id === uniqueId);

            if (removeIndex > -1) {
                state.ids.splice(removeIndex, 1);
            }
        }
    },
    extraReducers: {
        [fetchOutgoingConnections.pending]: (state, action) => {
            state.status = 'loading';
        },
        [fetchOutgoingConnections.fulfilled]: (state, action) => {
            state.status = 'idle';
            state.ids = action.payload;
        },
        [fetchOutgoingConnections.rejected]: (state, action) => {
            state.status = 'failed';
            state.error = action.error.message;
        }
    }
});

export default outgoingConnectionsSlice.reducer;
export const { outgoingConnectionAdded, outgoingConnectionRemoved } = outgoingConnectionsSlice.actions;

// Selectors
export const selectAllOutgoingConnections = state => {
    let ids = state.connections.outgoingConnections.ids;
    if (ids.length) {
        return ids.map(id => state.users.entities[id]);
    }

    return ids;
};
export const selectOutgoingConnectionsStatus = state => state.connections.outgoingConnections.status;
