import React, {useEffect, useRef, useState} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import classNames from 'classnames';
import UserService from '../../services/user.service';
import ConnectionPreviewDialog from '../Dialogs/ConnectionPreview';
import ConnectionListItem from './ConnectionListItem';
import AddConnectionDialog from '../Dialogs/AddConnection';
import YesNoMessageBox from '../MessageBoxes/YesNoMessageBox';
import * as Constants from '../../constants/constants';

//import { fetchOutgoingConnections, selectAllOutgoingConnections } from '../../redux/connections/outgoingConnectionsSlice';

export default function ConnectionsSideMenuItem(props) {
    /*const dispatch = useDispatch();
    const outgoingConnectionsStatus = useSelector(state => state.outgoingConnections.status);
    useEffect(() => {
        if (outgoingConnectionsStatus === 'idle') {
            dispatch(fetchOutgoingConnections());
        }
    }, [outgoingConnectionsStatus, dispatch]);
    const outgoingConnections = useSelector(selectAllOutgoingConnections);*/

    const [state, updateState] = useState({
        expanded: false,
        incomingExpanded: false,
        outgoingConnections: [],
        incomingConnections: [],
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

    const fetchOutgoingConnections = async () => {
        let outgoingConnections = await UserService.getOutgoingConnections(props.userDetails.uniqueId);

        return outgoingConnections;
    };

    const fetchIncomingConnections = async () => {
        let incomingConnections = await UserService.getIncomingConnections(props.userDetails.uniqueId);

        return incomingConnections;
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
            if (!state.expanded) {
                let outgoingConnections = await fetchOutgoingConnections();

                updateState(prevState => ({...prevState, expanded: true, outgoingConnections}));
            }
            else {
                updateState(prevState => ({...prevState, expanded: false}));
            }
        }
    }

    const toggleIncomingExpanded = async (event) => {
        if (!state.incomingExpanded) {
            let incomingConnections = await fetchIncomingConnections();

            updateState(prevState => ({...prevState, incomingExpanded: true, incomingConnections}));
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
        
        updateState(prevState => ({
            ...prevState, 
            selectedConnection, 
            selectedConnectionUpdated: false,
            selectedConnectionIsIncoming: isIncoming
        }));
    };

    const handleOutgoingConnectionClick = (event) => {
        handleConnectionClick(event, state.outgoingConnections, false);
    };

    const handleIncomingConnectionClick = (event) => {
        handleConnectionClick(event, state.incomingConnections, true);
    };

    const handleRemoveConnectionClick = (event) => {
        let clickedButton = event.target;

        let selectedConnection = state.outgoingConnections.find(outgoingConnection => outgoingConnection.uniqueId === clickedButton.dataset.connection);
        
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

    const handleAddedConnection = (newConnection) => {
        let outgoingConnections = state.outgoingConnections.slice().push(newConnection);

        updateState(prevState => ({
            ...prevState,
            outgoingConnections
        }));
    };

    const saveSelectedConnection = async () => {
        let updateConnection = state.selectedConnectionUpdated;

        if (updateConnection) {
            // This is going to add the connection to the list of outgoing connections
            // If it was an incoming connection and they updated it, this isn't necessarily ideal since maybe they turned off all connection types or wanted to remove the connection

            let results = await UserService.updateOutgoingConnection(state.selectedConnection);

            if (results) {
                let { userConnection, actionTaken } = results;

                switch (actionTaken) {
                    case Constants.UPDATE_USER_CONNECTION_ACTIONS.UPDATED: {
                            let outgoingConnections = state.outgoingConnections.slice();
                            let outgoingConnection = outgoingConnections.find(outgoingConnection => outgoingConnection.uniqueId === userConnection.uniqueId);
                            Object.assign(outgoingConnection, userConnection);

                            updateState(prevState => ({
                                ...prevState,
                                outgoingConnections,
                                selectedConnectionUpdated: false
                            }));
                        }

                        break;
                    case Constants.UPDATE_USER_CONNECTION_ACTIONS.ADDED: {
                            let outgoingConnections = state.outgoingConnections.slice().push(userConnection);

                            updateState(prevState => ({
                                ...prevState,
                                outgoingConnections,
                                selectedConnectionUpdated: false
                            }));
                        }

                        break;
                    case Constants.UPDATE_USER_CONNECTION_ACTIONS.NONE:
                    default:
                        updateState(prevState => ({
                            ...prevState,
                            selectedConnectionUpdated: false
                        }))
                        break;
                }
            }
        }
        else {
            updateState(prevState => ({
                ...prevState,
                selectedConnectionUpdated: false
            }));
        }
    };

    const removeSelectedConnection = async () => {
        let { data } = await UserService.removeOutgoingConnection(state.selectedConnection.uniqueId);

        if (data?.success) {
            let outgoingConnections = state.outgoingConnections;
            let outgoingConnectionIndex = outgoingConnections.findIndex(outgoingConnection => outgoingConnection.uniqueId === state.selectedConnection.uniqueId);

            if (outgoingConnectionIndex > -1) {
                outgoingConnections.splice(outgoingConnectionIndex, 1);
            }

            updateState(prevState => ({
                ...prevState,
                selectedConnection: null,
                outgoingConnections
            }));
        }
        else {
            // Should alert them that the removal failed
            updateState(prevState => ({
                ...prevState,
                selectedConnection: null
            }));
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
                            // Redux
                            /*outgoingConnections && outgoingConnections.length > 0
                            ? Object.entries(outgoingConnections).map(([uniqueId, details]) => (
                                    <ConnectionListItem key={uniqueId} uniqueId={uniqueId} details={details} handleConnectionClick={handleOutgoingConnectionClick} handleRemoveConnectionClick={handleRemoveConnectionClick} />
                                )
                            )
                            : <></>*/
                            state.outgoingConnections && state.outgoingConnections.length > 0
                            ? state.outgoingConnections.map(outgoingConnection => (
                                    <ConnectionListItem key={outgoingConnection.uniqueId} connection={outgoingConnection} handleConnectionClick={handleOutgoingConnectionClick} handleRemoveConnectionClick={handleRemoveConnectionClick} />
                                )
                            )
                            : <></>
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
                                        state.incomingConnections && state.incomingConnections.length > 0
                                        ? state.incomingConnections.map(incomingConnection => (
                                                <ConnectionListItem key={incomingConnection.uniqueId} connection={incomingConnection} handleConnectionClick={handleIncomingConnectionClick} />
                                            )
                                        )
                                        : <li key="None" className="list-group-item text-center" style={{fontSize: '.9em'}}>
                                            None
                                        </li>
                                    }
                                </ul>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <ConnectionPreviewDialog id="connectionDetails" connection={state.selectedConnection} updateConnection={updateSelectedConnection} saveConnection={saveSelectedConnection} removeConnection={removeSelectedConnection} />
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