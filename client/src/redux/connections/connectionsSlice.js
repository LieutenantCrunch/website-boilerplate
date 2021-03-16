import { combineReducers } from 'redux';

import outgoingConnectionsReducer from './outgoingConnectionsSlice';
import incomingConnectionsReducer from './incomingConnectionsSlice';
import currentConnectionReducer from './currentConnectionSlice';

import {outgoingConnectionAdded, outgoingConnectionRemoved} from './outgoingConnectionsSlice';
import {incomingConnectionAdded, incomingConnectionRemoved} from './incomingConnectionsSlice';
import {selectUserById, upsertUser} from '../users/usersSlice';

import * as Constants from '../../constants/constants';
import UserService from '../../services/user.service';

const connectionsReducer = combineReducers({
    outgoingConnections: outgoingConnectionsReducer,
    incomingConnections: incomingConnectionsReducer,
    currentConnection: currentConnectionReducer
});

// Utility functions
const clearConnectionTypes = connectionTypes => {
    if (connectionTypes) {
        return Object.keys(connectionTypes).reduce((previousValue, currentKey) => ({
            ...previousValue,
            [currentKey]: false
        }), {});
    }

    return connectionTypes;
}

export const connectionsMiddleware = storeApi => next => action => {
    let { dispatch, getState } = storeApi;
    let state = getState();

    if (typeof action === 'function') {
        return action(dispatch, getState);
    }
    else {
        switch (action.type) {
            case 'connections/postConnectionUpdate': {
                let { uniqueId } = action.payload;
                let connection = selectUserById(state, uniqueId);

                if (connection) {
                    UserService.updateConnection(connection).then(response => {
                        let { actionTaken, userConnection } = response;

                        switch (actionTaken) {
                            case Constants.UPDATE_USER_CONNECTION_ACTIONS.ADDED:
                                // Add to outgoing
                                dispatch(outgoingConnectionAdded(uniqueId));
                                // Remove from incoming
                                dispatch(incomingConnectionRemoved(uniqueId));
                                // Update user record
                                dispatch(upsertUser(userConnection));
                                break;
                            case Constants.UPDATE_USER_CONNECTION_ACTIONS.UPDATED:
                                // Update user record
                                dispatch(upsertUser(userConnection));
                                break;
                            case Constants.UPDATE_USER_CONNECTION_ACTIONS.NONE:
                            default:
                                // Do nothing
                                break;
                        }

                    }).catch(err => console.error(err.message));
                }

                break;
            }
            case 'connections/postConnectionRemove': {
                let { uniqueId } = action.payload;
                let connection = selectUserById(state, uniqueId);

                if (connection) {
                    UserService.removeOutgoingConnection(uniqueId).then(response => {
                        let { wasMutual } = response;

                        // Remove from outgoing
                        dispatch(outgoingConnectionRemoved(uniqueId));

                        // Based on response, add to incoming
                        if (wasMutual) {
                            dispatch(incomingConnectionAdded(uniqueId));
                        }

                        // Update user record, making sure connectedToCurrentUser and isMutual is reset to false
                        let userUpdates = {
                            uniqueId,
                            connectedToCurrentUser: false,
                            isMutual: false
                        };

                        // Reset all connectionTypes to false if they exist
                        if (connection.connectionTypes) {
                            userUpdates.connectionTypes = clearConnectionTypes(connection.connectionTypes);
                        }

                        dispatch(upsertUser(userUpdates));
                    }).catch(err => console.error(err.message));
                }

                break;
            }
            default:
                break;
        }

        return next(action);
    }
};

export default connectionsReducer;

// Action Creators
export const postConnectionUpdate = connection => ({type: 'connections/postConnectionUpdate', payload: connection});
export const postConnectionRemove = connection => ({type: 'connections/postConnectionRemove', payload: connection});
