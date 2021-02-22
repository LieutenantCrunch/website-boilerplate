import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import UserService from '../../services/user.service';

const initialState = {
    outgoingConnections: {},
    status: 'idle',
    error: null
};

export const fetchOutgoingConnections = createAsyncThunk('outgoingConnections/fetchOutgoingConnections', async () => {
    const response = await UserService.getOutgoingConnections();
    return response;
});

export const addOutgoingConnection = createAsyncThunk('outgoingConnections/addOutgoingConnection', async outgoingConnection => {
    const response = await UserService.updateOutgoingConnection(outgoingConnection);

    if (response) {
        return response.userConnection;
    }

    return null;
})

const outgoingConnectionsSlice = createSlice({
    name: 'outgoingConnections',
    initialState,
    reducers: {
        outgoingConnectionAdded(state, action) {
            state.outgoingConnections.push(action.payload);
        },
        outgoingConnectionUpdated(state, action) {
            const updatedConnection = action.payload;
            const existingConnection = state.outgoingConnections.find(outgoingConnection => outgoingConenction.uniqueId === updatedConnection.uniqueId);

            if (existingConnection) {
                Object.assign(existingConnection, updatedConnection);
            }
        }
    },
    extraReducers: {
        [fetchOutgoingConnections.pending]: (state, action) => {
            state.status = 'loading';
        },
        [fetchOutgoingConnections.fulfilled]: (state, action) => {
            state.status = 'succeeded';
            state.outgoingConnections = action.payload;
        },
        [fetchOutgoingConnections.rejected]: (state, action) => {
            state.status = 'failed';
            state.error = action.error.message;
        },
        [addOutgoingConnection.fulfilled]: (state, action) => {
            state.outgoingConnections.push(action.payload);
        }
    }
});

export const { outgoingConnectionAdded } = outgoingConnectionsSlice.actions;
export default outgoingConnectionsSlice.reducer;
export const selectAllOutgoingConnections = state => state.outgoingConnections.outgoingConnections;
export const selectOutgoingConnectionById = (state, outgoingConnectionId) => state.outgoingConnections.outgoingConnections[outgoingConnectionId];