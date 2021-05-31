import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

const initialState = {};

// Async Thunks
/* // This doesn't work in App.jsx useEffect. It works in other components, but not App.jsx.
// I don't know why, but I replaced it with a normal async call to getConnectionTypeDict and dispatched an action instead to populate the state
export const fetchCurrentUser = createAsyncThunk('connectionTypes/fetchConnectionTypeDict', async (arg, thunkAPI) => {
    const response = await UserService.getConnectionTypeDict();
    return response;
});*/

const connectionTypesSlice = createSlice({
    name: 'connectionTypes',
    initialState,
    reducers: {
        connectionTypesFetched: (state, action) => {
            // you can either mutate the contents of the Proxy-wrapped state value as long as it's an object or array, or you can return an entirely new value, but not both at once.
            // https://stackoverflow.com/questions/60002846/how-can-you-replace-entire-state-in-redux-toolkit-reducer
            // https://immerjs.github.io/immer/return/
            return action.payload;
        }
    }
});

export default connectionTypesSlice.reducer;
export const { connectionTypesFetched } = connectionTypesSlice.actions;

// Selectors
export const selectConnectionTypes = state => state.connections.connectionTypes;
