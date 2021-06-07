import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as Constants from '../../constants/constants';

const initialState = {
    allowPublicAccess: false,
    displayName: '', 
    displayNameIndex: -1, 
    email: '', 
    pfp: Constants.STATIC_IMAGES.PFP_DEFAULT,
    pfpSmall: Constants.STATIC_IMAGES.PFP_DEFAULT, 
    roles: [], 
    uniqueId: '',
    hasUnseenPostNotifications: false
};

// Async Thunks
/* // This doesn't work in App.jsx useEffect. It works in other components, but not App.jsx.
// I don't know why, but I replaced it with a normal async call to getCurrentDetails and dispatched an action instead to populate the state
export const fetchCurrentUser = createAsyncThunk('currentUser/fetchCurrentUser', async (arg, thunkAPI) => {
    const response = await UserService.getCurrentDetails();
    return response;
});*/

const currentUserSlice = createSlice({
    name: 'currentUser',
    initialState,
    reducers: {
        currentUserAllowPublicAccessUpdated: (state, action) => {
            state.allowPublicAccess = action.payload;
        },
        currentUserFetched: (state, action) => {
            let {
                allowPublicAccess,
                displayName, 
                displayNameIndex, 
                email, 
                pfp,
                pfpSmall, 
                preferences,
                roles, 
                uniqueId,
                hasUnseenPostNotifications
            } = action.payload;

            return {
                ...state,
                allowPublicAccess,
                displayName, 
                displayNameIndex, 
                email, 
                pfp,
                pfpSmall, 
                preferences,
                roles, 
                uniqueId,
                hasUnseenPostNotifications
            };
        },
        currentUserDisplayNameUpdated: (state, action) => {
            state.displayName = action.payload.displayName;
            state.displayNameIndex = action.payload.displayNameIndex;
        },
        currentUserPfpUpdated: (state, action) => {
            state.pfp = action.payload.pfp || Constants.STATIC_IMAGES.PFP_DEFAULT;
            state.pfpSmall = action.payload.pfpSmall || Constants.STATIC_IMAGES.PFP_DEFAULT;
        },
        currentUserPreferenceUpdated: (state, action) => {
            let { name, value } = action.payload;

            state.preferences[name] = value;
        },
        currentUserRoleAdded: (state, action) => {
            state.roles.push(action.payload);
        },
        currentUserRoleRemoved: (state, action) => {
            let removeRole = action.payload;
            let removeIndex = state.roles.findIndex(role => role === removeRole);

            if (removeIndex > -1) {
                state.ids.splice(removeIndex, 1);
            }
        },
        seenPostNotifications: (state, action) => {
            state.hasUnseenPostNotifications = false;
        },
        unseenPostNotificationAdded: (state, action) => {
            state.hasUnseenPostNotifications = true;
        }
    }
});

export default currentUserSlice.reducer;
export const { 
    currentUserAllowPublicAccessUpdated,
    currentUserFetched, 
    currentUserDisplayNameUpdated, 
    currentUserPfpUpdated, 
    currentUserPreferenceUpdated,
    currentUserRoleAdded, 
    currentUserRoleRemoved,
    seenPostNotifications,
    unseenPostNotificationAdded
} = currentUserSlice.actions;

// Selectors
export const selectCurrentUser = state => state.currentUser;
export const selectCurrentUserAllowPublicAccess = state => state.currentUser.allowPublicAccess;
export const selectCurrentUserDisplayName = state => state.currentUser.displayName;
export const selectCurrentUserDisplayNameIndex = state => state.currentUser.displayNameIndex;
export const selectCurrentUserEmail = state => state.currentUser.email;
export const selectCurrentUserPfp = state => state.currentUser.pfp;
export const selectCurrentUserPfpSmall = state => state.currentUser.pfpSmall;
export const selectCurrentUserPreferences = state => state.currentUser.preferences;
export const selectCurrentUserRoles = state => state.currentUser.roles;
export const selectCurrentUserUniqueId = state => state.currentUser.uniqueId;
export const selectHasUnseenPostNotifications = state => state.currentUser.hasUnseenPostNotifications;
