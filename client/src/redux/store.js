import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer';
import { connectionsMiddleware } from './connections/connectionsSlice';
import { usersMiddleware } from './users/usersSlice';

/* State:
{
    // Any time a user's details are queried from the server, they are stored here
    users: ReduxToolkit.EntityAdapter,

    // Root slice for managing anything to do with outgoing or incoming connections
    connections: {

        // A dictionary of all connection types from the server
        connectionTypes: {[key: string]: Boolean}

        // Functionality related to outgoing connections
        outgoingConnections: {

            // A list of user ids that can be used to look up users in the users array
            ids: Array<string>,

            // Used for indicating the status when connections are being fetched
            status: string,

            // Used for displaying any errors
            error: string
        },

        // Functionality related to outgoing connections
        incomingConnections: {

            // A list of user ids that can be used to look up users in the users array
            ids: Array<string>,

            // Used for indicating the status when connections are being fetched
            status: string,

            // Used for displaying any errors
            error: string
        },

        // Not used, left in as an example
        currentConnection: null
    },

    // Contains details about the currently logged in user
    currentUser: {

        // Whether the user allows anyone to access their profile/posts regardless of whether they have an account
        allowPublicAccess: Boolean,

        // The user's current display name
        displayName: string, 

        // The user's current display name index
        displayNameIndex: number, 

        // The user's email address (username)
        email: string, 

        // The user's current profile picture url
        pfp: string,

        // A small version of the user's current profile picture for faster load times
        pfpSmall: string, 

        // The list of roles the current user has
        roles: Array<string>, 

        // The user's unique id in the system
        uniqueId: string
    }
}
*/

const store = configureStore({
    reducer: rootReducer,
    middleware: [
        connectionsMiddleware,
        usersMiddleware
    ]
});

export default store;