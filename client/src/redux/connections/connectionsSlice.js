import { combineReducers } from 'redux';

import outgoingConnectionsReducer from './outgoingConnectionsSlice';
import incomingConnectionsReducer from './incomingConnectionsSlice';
import currentConnectionReducer from './currentConnectionSlice';

import {outgoingConnectionAdded, outgoingConnectionRemoved, outgoingConnectionUpdated} from './outgoingConnectionsSlice';
import {incomingConnectionAdded, incomingConnectionRemoved} from './incomingConnectionsSlice';

import * as Constants from '../../constants/constants';
import UserService from '../../services/user.service';

const connectionsReducer = combineReducers({
    outgoingConnections: outgoingConnectionsReducer,
    incomingConnections: incomingConnectionsReducer,
    currentConnection: currentConnectionReducer
});

export const myMiddleware = storeApi => next => action => {
    let { dispatch, getState } = storeApi;

    if (typeof action === 'function') {
        return action(dispatch, getState);
    }
    else {
        switch (action.type) {
            case 'connections/connectionUpdated': {
                let { uniqueId } = action.payload;
                let state = getState();
                let connection = selectConnectionById(state, uniqueId);

                if (!connection) {
                    connection = action.payload;
                }

                if (connection) {
                    UserService.updateConnection(connection).then(response => {
                        let { actionTaken, userConnection } = response;

                        switch (actionTaken) {
                            case Constants.UPDATE_USER_CONNECTION_ACTIONS.ADDED:
                                // Add to outgoing
                                dispatch(outgoingConnectionAdded(userConnection));
                                // Remove from incoming
                                dispatch(incomingConnectionRemoved(userConnection));
                                break;
                            case Constants.UPDATE_USER_CONNECTION_ACTIONS.UPDATED:
                                // Update outgoing
                                dispatch(outgoingConnectionUpdated(userConnection));
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
            case 'connections/connectionRemoved': {
                let { uniqueId } = action.payload;
                let state = getState();
                let connection = selectConnectionById(state, uniqueId);

                if (!connection) {
                    connection = action.payload;
                }

                if (connection) {
                    UserService.removeOutgoingConnection(uniqueId).then(response => {
                        let { wasMutual } = response;

                        // Remove from outgoing
                        dispatch(outgoingConnectionRemoved(connection));

                        // Based on response, add to incoming, making sure isMutual is reset to false
                        if (wasMutual) {
                            let incomingConnection = {
                                ...connection,
                                connectedToCurrentUser: false,
                                isMutual: false
                            };

                            dispatch(incomingConnectionAdded(incomingConnection));
                        }
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

// Selectors
export const selectConnectionById = (state, uniqueId) => {
    let connection = state.outgoingConnections.entities.find(entity => entity.uniqueId === uniqueId);

    if (!connection) {
        connection = state.incomingConnections.entities.find(entity => entity.uniqueId === uniqueId);
    }

    return connection;
};

// Action Creators
export const connectionUpdated = connection => ({type: 'connections/connectionUpdated', payload: connection});
export const connectionRemoved = connection => ({type: 'connections/connectionRemoved', payload: connection});
export const userBlocked = connection => ({type: 'connections/userBlocked', payload: connection});
export const userUnblocked = connection => ({type: 'connections/userUnblocked', payload: connection});
export const connectionUpdatedLocal = connection => ({type: 'connections/connectionUpdatedLocal', payload: connection});
