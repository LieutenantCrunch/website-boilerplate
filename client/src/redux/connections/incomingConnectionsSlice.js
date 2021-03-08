import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import UserService from '../../services/user.service';

const initialState = {
    entities: [],
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
            state.entities.push(action.payload);
        },
        incomingConnectionRemoved(state, action) {
            let { uniqueId } = action.payload;
            let removeIndex = state.entities.findIndex(entity => entity.uniqueId === uniqueId);

            if (removeIndex > -1) {
                state.entities.splice(removeIndex, 1);
            }
        },
        incomingConnectionUpdated(state, action) {
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
        [fetchIncomingConnections.pending]: (state, action) => {
            state.status = 'loading';
        },
        [fetchIncomingConnections.fulfilled]: (state, action) => {
            state.status = 'idle';
            state.entities = action.payload;
        },
        [fetchIncomingConnections.rejected]: (state, action) => {
            state.status = 'failed';
            state.error = action.error.message;
        }
    }
});

export default incomingConnectionsSlice.reducer;
export const { incomingConnectionAdded, incomingConnectionRemoved, incomingConnectionUpdated } = incomingConnectionsSlice.actions;

// Selectors
export const selectAllIncomingConnections = state => state.incomingConnections.entities;
