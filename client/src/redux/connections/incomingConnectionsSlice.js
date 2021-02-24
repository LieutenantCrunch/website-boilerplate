import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import UserService from '../../services/user.service';

const initialState = {
    incomingConnections: {},
    status: 'idle',
    error: null
};

export const fetchIncomingConnections = createAsyncThunk('incomingConnections/fetchIncomingConnections', async () => {
    const response = await UserService.getIncomingConnections();
    return response;
});

const incomingConnectionsSlice = createSlice({
    name: 'incomingConnections',
    initialState,
    reducers: {
    },
    extraReducers: {
        [fetchIncomingConnections.pending]: (state, action) => {
            state.status = 'loading';
        },
        [fetchIncomingConnections.fulfilled]: (state, action) => {
            state.status = 'idle';
            state.incomingConnections = action.payload;
        },
        [fetchIncomingConnections.rejected]: (state, action) => {
            state.status = 'failed';
            state.error = action.error.message;
        }
    }
});

export default incomingConnectionsSlice.reducer;
export const selectAllIncomingConnections = state => state.incomingConnections.incomingConnections;
export const selectIncomingConnectionById = (state, incomingConnectionId) => state.incomingConnections.incomingConnections[incomingConnectionId];
