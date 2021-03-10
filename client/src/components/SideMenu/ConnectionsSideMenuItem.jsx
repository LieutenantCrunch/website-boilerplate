import React, {useEffect, useRef, useState} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import classNames from 'classnames';
import ConnectionPreviewDialog from '../Dialogs/ConnectionPreview';
import ConnectionListItem from './ConnectionListItem';
import AddConnectionDialog from '../Dialogs/AddConnection';
import YesNoMessageBox from '../MessageBoxes/YesNoMessageBox';

import { 
    fetchOutgoingConnections, 
    selectAllOutgoingConnections,
    selectOutgoingConnectionsStatus
} from '../../redux/connections/outgoingConnectionsSlice';

import {
    fetchIncomingConnections,
    selectAllIncomingConnections,
    selectIncomingConnectionsStatus
} from '../../redux/connections/incomingConnectionsSlice';

import {
    postConnectionRemove,
    postConnectionUpdate
} from '../../redux/connections/connectionsSlice';

export default function ConnectionsSideMenuItem(props) {
    const dispatch = useDispatch();
    const outgoingConnectionsStatus = useSelector(selectOutgoingConnectionsStatus);
    const outgoingConnections = useSelector(selectAllOutgoingConnections);
    const incomingConnectionsStatus = useSelector(selectIncomingConnectionsStatus);
    const incomingConnections = useSelector(selectAllIncomingConnections);

    const [state, updateState] = useState({
        expanded: false,
        incomingExpanded: false,
        selectedConnection: null,
        selectedConnectionUpdated: false,
        selectedConnectionIsIncoming: false,
        removeMessageTitle: 'Remove Connection Confirmation',
        removeMessageMessage: 'Are you sure you want to remove this connection?',
        removeMessageSubtext: 'The other user will not be notified but will be able to see that the connection is no longer mutual.',
        yesNoMessageBox: null
    });

    const yesNoMessageBoxRef = useRef();

    const getYesNoMessageBox = () => {
        let yesNoMessageBox = state.yesNoMessageBox;

        if (!yesNoMessageBox && yesNoMessageBoxRef.current) {
            yesNoMessageBox = new bootstrap.Modal(yesNoMessageBoxRef.current, {show: false});

            updateState(prevState => ({
                ...prevState,
                yesNoMessageBox
            }));
        }

        return yesNoMessageBox;
    };

    const updateSelectedConnection = (selectedConnection) => {
        updateState(prevState => ({
            ...prevState,
            selectedConnection,
            selectedConnectionUpdated: true
        }));
    }

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

    const handleConnectionClick = (event, connections, isIncoming) => {
        let clickedButton = event.target;

        if (clickedButton.tagName === 'SMALL') {
            clickedButton = clickedButton.parentNode;
        }

        let selectedConnection = connections.find(connection => connection.uniqueId === clickedButton.dataset.connection);
        
        // Make a copy of the connection to work on
        selectedConnection = {
            ...selectedConnection,
            connectionTypes: {
                ...selectedConnection.connectionTypes
            }
        };

        updateState(prevState => ({
            ...prevState, 
            selectedConnection, 
            selectedConnectionUpdated: false,
            selectedConnectionIsIncoming: isIncoming
        }));
    };

    const handleOutgoingConnectionClick = (event) => {
        handleConnectionClick(event, outgoingConnections, false);
    };

    const handleIncomingConnectionClick = (event) => {
        handleConnectionClick(event, incomingConnections, true);
    };

    const handleRemoveConnectionClick = (event) => {
        let clickedButton = event.target;

        let selectedConnection = outgoingConnections.find(outgoingConnection => outgoingConnection.uniqueId === clickedButton.dataset.connection);
      
        updateState(prevState => ({
            ...prevState
            , selectedConnection
            , removeMessageMessage: `Are you sure you want to remove your connection to ${selectedConnection.displayName}#${selectedConnection.displayNameIndex}?`
        }));

        let yesNoMessageBoxInstance = getYesNoMessageBox();
        
        if (yesNoMessageBoxInstance) {
            yesNoMessageBoxInstance.show();
        }

        event.stopPropagation();
    }

    const handleAddedConnection = async (newConnection) => {
        const result = await dispatch(postConnectionUpdate(newConnection));
    };

    const saveSelectedConnection = async () => {
        let updateConnection = state.selectedConnectionUpdated;

        if (updateConnection) {
            // This is going to add the connection to the list of outgoing connections
            // If it was an incoming connection and they updated it, this isn't necessarily ideal since maybe they turned off all connection types or wanted to remove the connection

            let results = await dispatch(postConnectionUpdate(state.selectedConnection));

            updateState(prevState => ({
                ...prevState,
                selectedConnectionUpdated: false
            }))
        }
    };

    const removeSelectedConnection = async () => {
        let success = await dispatch(postConnectionRemove(state.selectedConnection));

        // Should alert them that the removal failed
        updateState(prevState => ({
            ...prevState,
            selectedConnection: null
        }));
    };

    const getOutgoingConnectionsList = () => {
        switch (outgoingConnectionsStatus) {
            case 'loading':
                return <li key="Loading" className="list-group-item text-center" style={{fontSize: '.9em'}}>
                        Loading...
                    </li>;
            case 'idle':
                return outgoingConnections && outgoingConnections.length > 0
                    ? outgoingConnections.map(outgoingConnection => (
                        <ConnectionListItem key={outgoingConnection.uniqueId} connection={outgoingConnection} handleConnectionClick={handleOutgoingConnectionClick} handleRemoveConnectionClick={handleRemoveConnectionClick} />
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
                return incomingConnections && incomingConnections.length > 0
                        ? incomingConnections.map(incomingConnection => (
                                <ConnectionListItem key={incomingConnection.uniqueId} connection={incomingConnection} handleConnectionClick={handleIncomingConnectionClick} />
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
            <div className="sideMenuItemTab"></div>
            <div className="sideMenuItemDetails">
                <div className="sideMenuItemTitle">
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
                    <button type="button" className="btn btn-sm btn-outline-primary border-0 w-100 text-left shadow-none" data-toggle="modal" data-target="#addConnection">
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
                                    classNames("btn btn-sm btn-outline-primary border-0 w-100 text-left shadow-none dropdown-toggle", {'show': state.incomingExpanded})
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

        <ConnectionPreviewDialog id="connectionDetails" userDetails={props.userDetails} connection={state.selectedConnection} updateConnection={updateSelectedConnection} saveConnection={saveSelectedConnection} removeConnection={removeSelectedConnection} isIncoming={state.selectedConnectionIsIncoming} />
        <AddConnectionDialog id="addConnection" appState={props.appState} onAddedConnection={handleAddedConnection} />
        <YesNoMessageBox ref={yesNoMessageBoxRef}
                caption={state.removeMessageTitle} 
                message={state.removeMessageMessage} 
                subtext={state.removeMessageSubtext} 
                yesCallback={removeSelectedConnection}
                noCallback={() => {}}
            />
        </>
    );
}