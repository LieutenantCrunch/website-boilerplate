import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import UserService from '../../services/user.service';

const initialState = {
    entities: [],
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
            state.entities.push(action.payload);
        },
        outgoingConnectionRemoved(state, action) {
            let { uniqueId } = action.payload;
            let removeIndex = state.entities.findIndex(entity => entity.uniqueId === uniqueId);

            if (removeIndex > -1) {
                state.entities.splice(removeIndex, 1);
            }
        },
        outgoingConnectionUpdated(state, action) {
            let { uniqueId } = action.payload;
            let updateIndex = state.entities.findIndex(entity => entity.uniqueId === uniqueId);

            if (updateIndex > -1) {
                state.entities[updateIndex] = action.payload;
            }
        }
    },
    extraReducers: {
        'connections/connectionUpdatedLocal': (state, action) => {
            let { uniqueId } = action.payload;
            let connection = state.entities.find(entity => entity.uniqueId === uniqueId);

            if (connection) {
                Object.assign(connection, action.payload);
            }
        },
        'connections/userBlocked': (state, action) => {
            let { uniqueId, isBlocked } = action.payload;
            let updateIndex = state.entities.findIndex(entity => entity.uniqueId === uniqueId);

            if (updateIndex > -1) {
                state.entities[updateIndex].isBlocked = isBlocked;
            }
        },
        'connections/userUnblocked': (state, action) => {
            let { uniqueId, isBlocked } = action.payload;
            let updateIndex = state.entities.findIndex(entity => entity.uniqueId === uniqueId);

            if (updateIndex > -1) {
                state.entities[updateIndex].isBlocked = isBlocked;
            }
        },
        [fetchOutgoingConnections.pending]: (state, action) => {
            state.status = 'loading';
        },
        [fetchOutgoingConnections.fulfilled]: (state, action) => {
            state.status = 'idle';
            state.entities = action.payload;
        },
        [fetchOutgoingConnections.rejected]: (state, action) => {
            state.status = 'failed';
            state.error = action.error.message;
        }
    }
});

export default outgoingConnectionsSlice.reducer;
export const { outgoingConnectionAdded, outgoingConnectionRemoved, outgoingConnectionUpdated } = outgoingConnectionsSlice.actions;

// Selectors
export const selectAllOutgoingConnections = state => state.outgoingConnections.entities;
