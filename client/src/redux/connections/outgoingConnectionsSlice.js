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
});

export const updateOutgoingConnection = createAsyncThunk('outgoingConnections/updateOutgoingConnection', async outgoingConnection => {
    const response = await UserService.updateOutgoingConnection(outgoingConnection);

    if (response) {
        return response.userConnection;
    }

    return null;
});

export const removeOutgoingConnection = createAsyncThunk('outgoingConnections/removeOutgoingConnection', async uniqueId => {
    const response = await UserService.removeOutgoingConnection(uniqueId);

    if (response.success) {
        return uniqueId;
    }

    return null;
})

const outgoingConnectionsSlice = createSlice({
    name: 'outgoingConnections',
    initialState,
    reducers: {
    },
    extraReducers: {
        [addOutgoingConnection.fulfilled]: (state, action) => {
            state.outgoingConnections.push(action.payload);
        },
        [fetchOutgoingConnections.pending]: (state, action) => {
            state.status = 'loading';
        },
        [fetchOutgoingConnections.fulfilled]: (state, action) => {
            state.status = 'idle';
            state.outgoingConnections = action.payload;
        },
        [fetchOutgoingConnections.rejected]: (state, action) => {
            state.status = 'failed';
            state.error = action.error.message;
        },
        [removeOutgoingConnection.fulfilled]: (state, action) => {
            if (action.payload) {
                let uniqueId = action.payload;
                let outgoingConnectionIndex = state.outgoingConnections.findIndex(outgoingConnection => outgoingConnection.uniqueId === uniqueId);

                if (outgoingConnectionIndex > -1) {
                    state.outgoingConnections.splice(outgoingConnectionIndex, 1);
                }
            }
        },
        [updateOutgoingConnection.fulfilled]: (state, action) => {
            const updatedConnection = action.payload;
            const existingConnection = state.outgoingConnections.find(outgoingConnection => outgoingConnection.uniqueId === updatedConnection.uniqueId);

            if (existingConnection) {
                Object.assign(existingConnection, updatedConnection);
            }
        }
    }
});

export const { outgoingConnectionAdded } = outgoingConnectionsSlice.actions;
export default outgoingConnectionsSlice.reducer;
export const selectAllOutgoingConnections = state => state.outgoingConnections.outgoingConnections;
export const selectOutgoingConnectionById = (state, outgoingConnectionId) => state.outgoingConnections.outgoingConnections[outgoingConnectionId];
