import React, { useContext, useState } from 'react';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import classNames from 'classnames';
import { MESSAGE_BOX_TYPES } from '../Dialogs/MessageBox';

// Components
import { ConnectionListItem } from './ConnectionListItem';
import AddConnectionDialog from '../Dialogs/AddConnection';
import ConnectionPreviewDialog from '../Dialogs/ConnectionPreview';

// Contexts
import { MessageBoxUpdaterContext } from '../../contexts/withMessageBox';

// Redux
import { 
    fetchOutgoingConnections, 
    selectOutgoingConnectionIds,
    selectOutgoingConnectionsStatus
} from '../../redux/connections/outgoingConnectionsSlice';

import {
    fetchIncomingConnections,
    selectIncomingConnectionIds,
    selectIncomingConnectionsStatus
} from '../../redux/connections/incomingConnectionsSlice';

import {
    postConnectionRemove,
    postConnectionUpdate
} from '../../redux/connections/connectionsSlice';

export default function ConnectionsSideMenuItem(props) {
    const dispatch = useDispatch();
    const outgoingConnectionsStatus = useSelector(selectOutgoingConnectionsStatus);
    const outgoingConnectionIds = useSelector(selectOutgoingConnectionIds, shallowEqual);
    const incomingConnectionsStatus = useSelector(selectIncomingConnectionsStatus);
    const incomingConnectionIds = useSelector(selectIncomingConnectionIds, shallowEqual);
    const setMessageBoxOptions = useContext(MessageBoxUpdaterContext);

    const [state, updateState] = useState({
        expanded: false,
        incomingExpanded: false,
        selectedConnectionId: null
    });

    const toggleExpanded = async (event) => {
        if (event.target && event.target.className.startsWith('sideMenuItem')) {
            if (!state.expanded && outgoingConnectionsStatus === 'idle') {
                dispatch(fetchOutgoingConnections());

                updateState(prevState => ({...prevState, expanded: true}));
            }
            else {
                updateState(prevState => ({...prevState, expanded: false}));
            }
        }
    }

    const toggleIncomingExpanded = async (event) => {
        if (!state.incomingExpanded && incomingConnectionsStatus === 'idle') {
            dispatch(fetchIncomingConnections());

            updateState(prevState => ({...prevState, incomingExpanded: true}));
        }
        else {
            updateState(prevState => ({...prevState, incomingExpanded: false}));
        }
    }

    const handleConnectionClick = (event) => {
        let clickedButton = event.target;

        if (clickedButton.tagName === 'SMALL') {
            clickedButton = clickedButton.parentNode;
        }

        let selectedConnectionId = clickedButton.dataset.connection;
        
        updateState(prevState => ({
            ...prevState, 
            selectedConnectionId
        }));
    };

    const handleRemoveConnectionClick = (event, { displayName, displayNameIndex, uniqueId }) => {
        setMessageBoxOptions({
            isOpen: true,
            messageBoxProps: {
                actions: MESSAGE_BOX_TYPES.YES_NO,
                caption: 'Remove Connection Confirmation',
                message: `Are you sure you want to remove your connection to ${displayName}#${displayNameIndex}?`,
                onConfirm: () => { removeSelectedConnection(uniqueId) },
                onDeny: () => {},
                onCancel: undefined,
                subtext: 'The other user will not be notified but will be able to see that the connection is no longer mutual.'
            }
        });

        event.stopPropagation();
    }

    const handleAddedConnection = async (newConnection) => {
        const result = await dispatch(postConnectionUpdate(newConnection));
    };

    const removeSelectedConnection = async (connectionUniqueId) => {
        let success = await dispatch(postConnectionRemove(connectionUniqueId));

        // Should alert them that the removal failed
    };

    const getOutgoingConnectionsList = () => {
        switch (outgoingConnectionsStatus) {
            case 'loading':
                return <li key="Loading" className="list-group-item text-center" style={{fontSize: '.9em'}}>
                        Loading...
                    </li>;
            case 'idle':
                return outgoingConnectionIds && outgoingConnectionIds.length > 0
                    ? outgoingConnectionIds.map(outgoingConnectionId => (
                            <ConnectionListItem key={outgoingConnectionId} connectionId={outgoingConnectionId} handleConnectionClick={handleConnectionClick} handleRemoveConnectionClick={handleRemoveConnectionClick} />
                        )
                    )
                    : <li key="None" className="list-group-item text-center" style={{fontSize: '.9em'}}>
                        None
                    </li>;
            case 'failed':
            default:
                return <li key="Error" className="list-group-item text-center" style={{fontSize: '.9em'}}>
                        Error
                    </li>;
        }
    };

    const getIncomingConnectionsList = () => {
        switch (incomingConnectionsStatus) {
            case 'loading':
                return <li key="Loading" className="list-group-item text-center" style={{fontSize: '.9em'}}>
                        Loading...
                    </li>;
            case 'idle':
                return incomingConnectionIds && incomingConnectionIds.length > 0
                        ? incomingConnectionIds.map(incomingConnectionId => (
                                <ConnectionListItem key={incomingConnectionId} connectionId={incomingConnectionId} handleConnectionClick={handleConnectionClick} />
                            )
                        )
                        : <li key="None" className="list-group-item text-center" style={{fontSize: '.9em'}}>
                            None
                        </li>;
            case 'failed':
            default:
                return <li key="Error" className="list-group-item text-center" style={{fontSize: '.9em'}}>
                        Error
                    </li>;
        }
    };

    return (
        <>
            <div className={classNames('sideMenuItem', {'sideMenuItemExpanded': state.expanded})}
                onClick={toggleExpanded}
            >
                <div className="sideMenuItemTab" title="Connections"></div>
                <div className="sideMenuItemDetails">
                    <div className="sideMenuItemTitle" title="Connections">
                        <h4 className="sideMenuItemText">Connections</h4>
                        <div className="sideMenuItemIcon"></div>
                    </div>
                    <div className="sideMenuItemContent">
                        <hr style={{
                            backgroundColor: 'rgb(204, 204, 204)',
                            border: '0 none',
                            color: 'rgb(204, 204, 204)',
                            height: '2px',
                            margin: 0,
                            opacity: 1
                        }} />
                        <button type="button" className="btn btn-sm btn-outline-primary border-0 w-100 text-start shadow-none" data-bs-toggle="modal" data-bs-target="#addConnection">
                            <strong>Add New...</strong>
                        </button>
                        <hr style={{
                            backgroundColor: 'rgb(204, 204, 204)',
                            border: '0 none',
                            color: 'rgb(204, 204, 204)',
                            height: '1px',
                            margin: 0,
                            opacity: 1
                        }} />
                        <ul className="sideMenuItemList">
                            {
                                getOutgoingConnectionsList()
                            }
                            <li style={{
                                borderWidth: '2px 0',
                                borderStyle: 'solid none',
                                borderColor: 'rgb(204, 204, 204)'
                            }}>
                                <button type="button" className={
                                        classNames("btn btn-sm btn-outline-primary border-0 w-100 text-start shadow-none dropdown-toggle", {'show': state.incomingExpanded})
                                    }
                                    onClick={toggleIncomingExpanded}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <span style={{flexGrow: 1}}>
                                        Incoming
                                    </span>
                                </button>
                            </li>
                            <li>
                                <div className={classNames('sideSubMenuItem', {'sideSubMenuItemExpanded': state.incomingExpanded})}>
                                    <ul className="list-group" style={{paddingLeft: 0}}>
                                        {
                                            getIncomingConnectionsList()
                                        }
                                    </ul>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <ConnectionPreviewDialog id="connectionDetails" connectionId={state.selectedConnectionId} />
            <AddConnectionDialog id="addConnection" onAddedConnection={handleAddedConnection} />
        </>
    );
}