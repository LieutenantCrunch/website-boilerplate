import React, {useEffect, useState, useRef} from 'react';
import classNames from 'classnames';
import UserService from '../../services/user.service';
import ConnectionPreviewDialog from '../Dialogs/ConnectionPreview';
import AddConnectionDialog from '../Dialogs/AddConnection';
import YesNoMessageBox from '../MessageBoxes/YesNoMessageBox';

export default function ConnectionsSideMenuItem(props) {
    const [state, updateState] = useState({
        expanded: false,
        connections: {},
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

    const getConnections = async () => {
        let connections = await UserService.getConnections(props.userDetails.uniqueID);

        return connections;
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

    const toggleExpanded = async () => {
        if (!state.expanded) {
            let connections = await getConnections();

            updateState(prevState => ({...prevState, expanded: true, connections}));
        }
        else {
            updateState(prevState => ({...prevState, expanded: false}));
        }
    }

    const handleConnectionClick = (event) => {
        let clickedButton = event.target;

        if (clickedButton.tagName === 'SMALL') {
            clickedButton = clickedButton.parentNode;
        }

        let selectedConnection = {
            id: clickedButton.dataset.connection,
            details: state.connections[clickedButton.dataset.connection]
        };
        
        updateState(prevState => ({...prevState, selectedConnection, selectedConnectionUpdated: false}));
    };

    const handleRemoveConnectionClick = (event) => {
        let clickedButton = event.target;

        let selectedConnection = {
            id: clickedButton.dataset.connection,
            details: state.connections[clickedButton.dataset.connection]
        };
        
        updateState(prevState => ({...prevState, selectedConnection}));

        let yesNoMessageBoxInstance = getYesNoMessageBox();
        
        if (yesNoMessageBoxInstance) {
            yesNoMessageBoxInstance.show();
        }

        event.stopPropagation();
    }

    const saveSelectedConnection = () => {
        let updateConnection = state.selectedConnectionUpdated;

        updateState(prevState => ({
            ...prevState,
            connections: {
                ...prevState.connections,
                [prevState.selectedConnection.id]: {
                    ...prevState.selectedConnection.details
                }
            },
            selectedConnectionUpdated: false
        }));

        if (updateConnection) {
            UserService.updateOutgoingConnection({ [state.selectedConnection.id]: state.selectedConnection.details });
        }
    };

    const removeSelectedConnection = () => {
        UserService.removeOutgoingConnection({id: state.selectedConnection.id});

        updateState(prevState => ({
            ...prevState,
            selectedConnection: null
        }));
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
                    <button type="button" className="btn btn-sm btn-outline-primary border-0 w-100 text-left" data-toggle="modal" data-target="#addConnection">
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
                            Object.keys(state.connections).length > 0
                            ? Object.entries(state.connections).map(([uniqueID, details]) => {
                                return (
                                    <li className="sideMenuItemListItem" key={uniqueID}>
                                        <div className="sideMenuItemListItemText">
                                            <button type="button" className="btn btn-sm btn-outline-primary border-0 w-100 text-left" data-toggle="modal" data-target="#connectionDetails" data-connection={uniqueID} onClick={handleConnectionClick}>
                                                {details.displayName}<small className="text-muted">#{details.displayNameIndex}</small>
                                            </button>
                                        </div>
                                        <div className="sideMenuItemListItemIcon" style={{display: details.isMutual ? '' : 'none'}}>
                                            <small>🤝</small>
                                        </div>
                                        <div className="sideMenuItemListItemRemove">
                                            <button type="button" className="btn btn-close" arial-label="remove" style={{boxSizing: 'border-box'}} data-connection={uniqueID} onClick={handleRemoveConnectionClick}></button>
                                        </div>
                                    </li>
                                );
                            })
                            : <></>
                        }
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