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