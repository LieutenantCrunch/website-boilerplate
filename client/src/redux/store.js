import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer';
import { connectionsMiddleware } from './connections/connectionsSlice';
import { postsMiddleware} from './notifications/postsSlice';
import { usersMiddleware } from './users/usersSlice';

/* State:
{
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

        // The user's preferences for functionality around the site
        preferences: {

            // When a person first logs into the site 
            //  or when they do something that has to return them to a page (ex: delete a post from the view post page)
            //  this is the page they will go to. If undefined, assume /profile
            startPage: string | undefined,

            // Whether the user's own posts should show up in their feed or not.
            showMyPostsInFeed: Boolean,

            // When the user is creating a new post, it will default to this type
            postType: number,

            // All media (video / audio) will have its volume initially set to this value / 100 by default.
            mediaVolume: number,

            // The type of posts to display in the user's feed by default
            feedFilter: number,

            // The default audience of new posts
            postAudience: number
        },

        // The list of roles the current user has
        roles: Array<string>, 

        // The user's unique id in the system
        uniqueId: string,

        // Indicates whether there are unseen post notifications for display in the header
        hasUnseenPostNotifications: Boolean
    },

    notifications: {

        // Contains notifications about posts
        posts: ReduxToolkit.EntityAdapter({

            // Indicates whether the current entities dictionary is in sync with the server
            // A false value indicates that the notifications should be re-fetched
            valid: Boolean
        })
    },

    // Any time a user's details are queried from the server, they are stored here
    users: ReduxToolkit.EntityAdapter,
}
*/

const store = configureStore({
    reducer: rootReducer,
    middleware: [
        connectionsMiddleware,
        postsMiddleware,
        usersMiddleware
    ]
});

export default store;