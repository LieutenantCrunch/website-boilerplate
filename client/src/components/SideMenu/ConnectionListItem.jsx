import React from 'react';
import classNames from 'classnames';
import {isMobile} from 'react-device-detect';

import Zoom from '@material-ui/core/Zoom';

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
                <img src={props.details.pfpSmall} className="border border-secondary rounded-circle w-100" />
            </div>
            <div className="sideMenuItemListItemText" style={{overflow: 'hidden'}}>
                <HtmlTooltip title={
                        <>
                            {props.details.displayName}<small>#{props.details.displayNameIndex}</small>
                        </>
                    }
                    TransitionComponent={Zoom}
                    enterDelay={500}
                    arrow
                    interactive
                >
                    <button type="button" className={classNames('btn btn-outline-primary border-0 w-100 text-left', {'btn-sm': !isMobile})} data-toggle="modal" data-target="#connectionDetails" data-connection={props.uniqueId} onClick={props.handleConnectionClick}>
                        {props.details.displayName}<small className="text-muted">#{props.details.displayNameIndex}</small>
                    </button>
                </HtmlTooltip>
            </div>
            <div className="sideMenuItemListItemIcon" style={{display: props.details.isMutual ? '' : 'none'}}>
                <small>🤝</small>
            </div>
            <div className="sideMenuItemListItemRemove" style={{display: props.handleRemoveConnectionClick ? '' : 'none'}}>
                <button type="button" className="btn btn-close" arial-label="remove" style={{boxSizing: 'border-box'}} data-connection={props.uniqueId} onClick={handleRemoveClick}></button>
            </div>
        </li>
    );
}