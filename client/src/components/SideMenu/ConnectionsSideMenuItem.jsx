import React, {useRef, useState} from 'react';
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
import { selectUserById } from '../../redux/users/usersSlice';

export default function ConnectionsSideMenuItem(props) {
    const dispatch = useDispatch();
    const outgoingConnectionsStatus = useSelector(selectOutgoingConnectionsStatus);
    const outgoingConnections = useSelector(selectAllOutgoingConnections);
    const incomingConnectionsStatus = useSelector(selectIncomingConnectionsStatus);
    const incomingConnections = useSelector(selectAllIncomingConnections);

    const [state, updateState] = useState({
        expanded: false,
        incomingExpanded: false,
        selectedConnectionId: null,
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

    const handleRemoveConnectionClick = (event) => {
        let clickedButton = event.target;

        let selectedConnectionId = clickedButton.dataset.connection;
        let user = selectUserById(selectedConnectionId);
      
        updateState(prevState => ({
            ...prevState,
            selectedConnectionId,
            removeMessageMessage: `Are you sure you want to remove your connection to ${user.displayName}#${user.displayNameIndex}?`
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

    const removeSelectedConnection = async () => {
        let success = await dispatch(postConnectionRemove(state.selectedConnectionId));

        // Should alert them that the removal failed
        updateState(prevState => ({
            ...prevState,
            selectedConnectionId: null
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
                            <ConnectionListItem key={outgoingConnection.uniqueId} connection={outgoingConnection} handleConnectionClick={handleConnectionClick} handleRemoveConnectionClick={handleRemoveConnectionClick} />
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
                                <ConnectionListItem key={incomingConnection.uniqueId} connection={incomingConnection} handleConnectionClick={handleConnectionClick} />
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
            <div className="sideMenuItemDetails" title="Connections">
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