import { createSlice, createEntityAdapter } from '@reduxjs/toolkit';
import { currentUserAllowPublicAccessUpdated, currentUserPreferencesUpdated } from './currentUserSlice';
import { fetchOutgoingConnections } from '../connections/outgoingConnectionsSlice';
import { fetchIncomingConnections } from '../connections/incomingConnectionsSlice';
import UserService from '../../services/user.service';

const currentUserAllowPublicAccessUpdatedType = currentUserAllowPublicAccessUpdated.toString();
const currentUserPreferencesUpdatedType = currentUserPreferencesUpdated.toString();
const fetchOutgoingConnectionsType = fetchOutgoingConnections.fulfilled.toString();
const fetchIncomingConnectionsType = fetchIncomingConnections.fulfilled.toString();

const usersAdapter = createEntityAdapter({
    selectId: user => user.uniqueId,
    sortComparer: (a, b) => `${a.displayName || '' }#${a.displayNameIndex || -1}`.localeCompare(`${b.displayName || '' }#${b.displayNameIndex || -1}`)
});
const initialState = usersAdapter.getInitialState();

const usersSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {
        upsertUser: usersAdapter.upsertOne,
        upsertUsers: usersAdapter.upsertMany
    }
});

export default usersSlice.reducer;
export const { upsertUser, upsertUsers } = usersSlice.actions;
const globalizedSelectors = usersAdapter.getSelectors(state => state.users);

// Action Creators
export const postUserUpdate = uniqueId => ({type: 'users/postUserUpdate', payload: uniqueId});

// Selectors
export const selectUserById = globalizedSelectors.selectById;

// Middleware
export const usersMiddleware = storeApi => next => action => {
    let { dispatch, getState } = storeApi;

    if (typeof action === 'function') {
        return action(dispatch, getState);
    }
    else {
        switch (action.type) {
            case currentUserAllowPublicAccessUpdatedType: {
                let name = 'allowPublicAccess';
                let value = action.payload;

                UserService.updateUserPreferences([{name, value}]);

                break;
            }
            case currentUserPreferencesUpdatedType: {
                let preferences = action.payload;

                UserService.updateUserPreferences(preferences);

                break;
            }
            case fetchOutgoingConnectionsType:
            case fetchIncomingConnectionsType: {
                let users = action.payload;
                
                dispatch(upsertUsers(users));

                action.payload = users.map(user => user.uniqueId);

                break;
            }
            case 'users/postUserUpdate': {
                let uniqueId = action.payload;
                let user = selectUserById(getState(), uniqueId);

                console.log(`postUserUpdate received for user ${uniqueId}`);
                break;
            }
            default:
                break;
        }

        return next(action);
    }
};
