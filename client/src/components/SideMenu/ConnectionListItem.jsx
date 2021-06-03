import React from 'react';
import classNames from 'classnames';
import {isMobile} from 'react-device-detect';

// Redux
import { useSelector } from 'react-redux';
import { selectUserById } from '../../redux/users/usersSlice'

import { HtmlTooltip } from '../HtmlTooltip';

export const ConnectionListItem = ({ connectionId, handleConnectionClick, handleRemoveConnectionClick }) => {
    const connection = useSelector(state => selectUserById(state, connectionId));

    const handleRemoveClick = (event) => {
        if (handleRemoveConnectionClick) {
            handleRemoveConnectionClick(event, connection);
        }
    };

    return (
        <li className="sideMenuItemListItem">
            <div style={{width: '15%', padding: '1%'}}>
                <img src={connection.pfpSmall} className="border border-secondary rounded-circle w-100" />
            </div>
            <div className="sideMenuItemListItemText" style={{overflow: 'hidden'}}>
                <HtmlTooltip title={
                        <>
                            {connection.displayName}
                            {
                                connection.displayNameIndex !== 0 &&
                                <small>#{connection.displayNameIndex}</small>
                            }
                        </>
                    }
                    enterDelay={500}
                    arrow
                >
                    <button type="button" className={classNames('btn btn-outline-primary border-0 w-100 text-start', {'btn-sm': !isMobile})} data-bs-toggle="modal" data-bs-target="#connectionDetails" data-connection={connection.uniqueId} onClick={handleConnectionClick}>
                        {connection.displayName}
                        {
                            connection.displayNameIndex !== 0 &&
                            <small className="text-muted">#{connection.displayNameIndex}</small>
                        }
                    </button>
                </HtmlTooltip>
            </div>
            <div className="sideMenuItemListItemIcon" style={{display: connection.isMutual ? '' : 'none'}}>
                <small>🤝</small>
            </div>
            <div className="sideMenuItemListItemRemove" style={{display: handleRemoveConnectionClick ? '' : 'none'}}>
                <button type="button" className="btn btn-close" arial-label="remove" style={{boxSizing: 'border-box'}} data-connection={connection.uniqueId} onClick={handleRemoveClick}></button>
            </div>
        </li>
    );
};
