import React from 'react';
import classNames from 'classnames';
import {isMobile} from 'react-device-detect';

import { HtmlTooltip } from '../HtmlTooltip';

export default function ConnectionListItem(props) {
    const handleRemoveClick = (event) => {
        if (props.handleRemoveConnectionClick) {
            props.handleRemoveConnectionClick(event);
        }
    };

    return (
        <li className="sideMenuItemListItem">
            <div style={{width: '15%', padding: '1%'}}>
                <img src={props.connection.pfpSmall} className="border border-secondary rounded-circle w-100" />
            </div>
            <div className="sideMenuItemListItemText" style={{overflow: 'hidden'}}>
                <HtmlTooltip title={
                        <>
                            {props.connection.displayName}<small>#{props.connection.displayNameIndex}</small>
                        </>
                    }
                    enterDelay={500}
                    arrow
                >
                    <button type="button" className={classNames('btn btn-outline-primary border-0 w-100 text-start', {'btn-sm': !isMobile})} data-bs-toggle="modal" data-bs-target="#connectionDetails" data-connection={props.connection.uniqueId} onClick={props.handleConnectionClick}>
                        {props.connection.displayName}<small className="text-muted">#{props.connection.displayNameIndex}</small>
                    </button>
                </HtmlTooltip>
            </div>
            <div className="sideMenuItemListItemIcon" style={{display: props.connection.isMutual ? '' : 'none'}}>
                <small>🤝</small>
            </div>
            <div className="sideMenuItemListItemRemove" style={{display: props.handleRemoveConnectionClick ? '' : 'none'}}>
                <button type="button" className="btn btn-close" arial-label="remove" style={{boxSizing: 'border-box'}} data-connection={props.connection.uniqueId} onClick={handleRemoveClick}></button>
            </div>
        </li>
    );
}