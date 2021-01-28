import React, {useState, useRef} from 'react';
import classNames from 'classnames';
import UserService from '../../services/user.service';
import ConnectionPreviewDialog from '../Dialogs/ConnectionPreview';
import ConnectionListItem from './ConnectionListItem';
import AddConnectionDialog from '../Dialogs/AddConnection';
import YesNoMessageBox from '../MessageBoxes/YesNoMessageBox';

export default function ConnectionsSideMenuItem(props) {
    const [state, updateState] = useState({
        expanded: false,
        incomingExpanded: false,
        outgoingConnections: {},
        incomingConnections: {},
        selectedConnection: null,
        selectedConnectionUpdated: false,
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

    const getOutgoingConnections = async () => {
        let outgoingConnections = await UserService.getOutgoingConnections(props.userDetails.uniqueId);

        return outgoingConnections;
    };

    const getIncomingConnections = async () => {
        let incomingConnections = await UserService.getIncomingConnections(props.userDetails.uniqueId);

        return incomingConnections;
    };

    const updateSelectedConnection = (selectedConnection) => {
        updateState(prevState => ({
            ...prevState,
            selectedConnection: {
                ...prevState.selectedConnection,
                ...selectedConnection
            },
            selectedConnectionUpdated: true
        }));
    }

    const toggleExpanded = async (event) => {
        if (event.target && event.target.className.startsWith('sideMenuItem')) {
            if (!state.expanded) {
                let outgoingConnections = await getOutgoingConnections();

                updateState(prevState => ({...prevState, expanded: true, outgoingConnections}));
            }
            else {
                updateState(prevState => ({...prevState, expanded: false}));
            }
        }
    }

    const toggleIncomingExpanded = async (event) => {
        if (!state.incomingExpanded) {
            let incomingConnections = await getIncomingConnections();

            updateState(prevState => ({...prevState, incomingExpanded: true, incomingConnections}));
        }
        else {
            updateState(prevState => ({...prevState, incomingExpanded: false}));
        }
    }

    const handleConnectionClick = (event, connectionDict) => {
        let clickedButton = event.target;

        if (clickedButton.tagName === 'SMALL') {
            clickedButton = clickedButton.parentNode;
        }

        let selectedConnection = {
            id: clickedButton.dataset.connection,
            details: connectionDict[clickedButton.dataset.connection]
        };
        
        updateState(prevState => ({...prevState, selectedConnection, selectedConnectionUpdated: false}));
    };

    const handleOutgoingConnectionClick = (event) => {
        handleConnectionClick(event, state.outgoingConnections);
    };

    const handleIncomingConnectionClick = (event) => {
        handleConnectionClick(event, state.incomingConnections);
    };

    const handleRemoveConnectionClick = (event) => {
        let clickedButton = event.target;

        let selectedConnection = {
            id: clickedButton.dataset.connection,
            details: state.outgoingConnections[clickedButton.dataset.connection]
        };
        
        updateState(prevState => ({
            ...prevState
            , selectedConnection
            , removeMessageMessage: `Are you sure you want to remove your connection to ${selectedConnection.details.displayName}#${selectedConnection.details.displayNameIndex}?`
        }));

        let yesNoMessageBoxInstance = getYesNoMessageBox();
        
        if (yesNoMessageBoxInstance) {
            yesNoMessageBoxInstance.show();
        }

        event.stopPropagation();
    }

    const saveSelectedConnection = () => {
        let updateConnection = state.selectedConnectionUpdated;

        if (updateConnection) {
            // This is going to add the connection to the list of outgoing connections
            // If it was an incoming connection and they updated it, this isn't necessarily ideal since maybe they turned off all connection types or wanted to remove the connection

            updateState(prevState => ({
                ...prevState,
                outgoingConnections: {
                    ...prevState.outgoingConnections,
                    [prevState.selectedConnection.id]: {
                        ...prevState.selectedConnection.details,
                        isMutual: true
                    }
                },
                selectedConnectionUpdated: false
            }));

            UserService.updateOutgoingConnection({ [state.selectedConnection.id]: state.selectedConnection.details });
        }
        else {
            updateState(prevState => ({
                ...prevState,
                selectedConnectionUpdated: false
            }));
        }
    };

    const removeSelectedConnection = async () => {
        let { data } = await UserService.removeOutgoingConnection({id: state.selectedConnection.id});

        if (data?.success) {
            let outgoingConnections = {...state.outgoingConnections};
            delete outgoingConnections[state.selectedConnection.id];

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
                            state.outgoingConnections && Object.keys(state.outgoingConnections).length > 0
                            ? Object.entries(state.outgoingConnections).map(([uniqueId, details]) => (
                                    <ConnectionListItem key={uniqueId} uniqueId={uniqueId} details={details} handleConnectionClick={handleOutgoingConnectionClick} handleRemoveConnectionClick={handleRemoveConnectionClick} />
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
                                        state.incomingConnections && Object.keys(state.incomingConnections).length > 0
                                        ? Object.entries(state.incomingConnections).map(([uniqueId, details]) => (
                                                <ConnectionListItem key={uniqueId} uniqueId={uniqueId} details={details} handleConnectionClick={handleIncomingConnectionClick} />
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

        <ConnectionPreviewDialog id="connectionDetails" selectedConnection={state.selectedConnection} updateSelectedConnection={updateSelectedConnection} saveSelectedConnection={saveSelectedConnection} />
        <AddConnectionDialog id="addConnection" appState={props.appState} />
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