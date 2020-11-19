import React, {useEffect, useState, useRef} from 'react';
import classNames from 'classnames';
import UserService from '../../services/user.service';
import ConnectionPreviewDialog from '../Dialogs/ConnectionPreview';

export default function ConnectionsSideMenuItem(props) {
    const [state, updateState] = useState({
        expanded: false,
        connections: {},
        selectedConnection: null
    })

    const getConnections = async () => {
        let connections = await UserService.getConnections(props.userDetails.uniqueID);

        return connections;
    };

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

        let selectedConnection = state.connections[clickedButton.dataset.connection];
        
        updateState(prevState => ({...prevState, selectedConnection}));
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
                    <ul className="sideMenuItemList">
                        {
                            Object.entries(state.connections).map(([uniqueID, details]) => {
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
                                    </li>
                                );
                            })
                        }
                    </ul>
                </div>
            </div>
        </div>

        <ConnectionPreviewDialog id="connectionDetails" selectedConnection={state.selectedConnection} fetchConnectionTypes={props.fetchConnectionTypes} appState={props.appState} />
        </>
    );
}