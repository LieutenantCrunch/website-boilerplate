import React, {useEffect, useState, useRef} from 'react';
import classNames from 'classnames';
import UserService from '../../services/user.service';

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

    const handleConnectionClick = function (event) {
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
                                            <button className="btn btn-sm btn-outline-primary border-0 w-100 text-left" data-toggle="modal" data-target="#connectionDetails" data-connection={uniqueID} onClick={handleConnectionClick}>
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

        <div id="connectionDetails" className="modal fade" tabIndex="-1" aria-labelledby="connectionDetailsLabel" aria-hidden="true">
            <div>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header card-header">
                            <h5 className="modal-title" id="connectionDetailsLabel">{state.selectedConnection?.displayName}<small className="text-muted">#{state.selectedConnection?.displayNameIndex}</small></h5>
                            <button type="button" className="close" data-dismiss="modal" arial-label="close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="text-center">
                                <img src={state.selectedConnection?.pfpSmall} className="border rounded-circle w-25" />
                            </p>
                        </div>
                        <div className="modal-footer card-footer">
                            <small style={{ display: state.selectedConnection?.isMutual ? '' : 'none'}}>🤝 This connection is mutual!</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}