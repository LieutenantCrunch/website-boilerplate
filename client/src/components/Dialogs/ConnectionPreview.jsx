import React, {useState, useRef, useEffect} from 'react';
import classNames from 'classnames';
import ConnectionButton from '../FormControls/ConnectionButton';

// Redux
import { useSelector } from 'react-redux';
import { selectUserById } from '../../redux/users/usersSlice';
import { selectCurrentUserAllowPublicAccess } from '../../redux/users/currentUserSlice';

export default function ConnectionPreviewDialog (props) {
    const connection = useSelector(state => selectUserById(state, props.connectionId));
    const currentUserAllowPublicAccess = useSelector(selectCurrentUserAllowPublicAccess);
    const mainDiv = useRef();

    const handleCloseClick = (event) => {
        
    };

    const closeDialog = () => {
        if (mainDiv.current) {
            let modal = bootstrap.Modal.getInstance(mainDiv.current);

            modal.hide();
        }
    };

    const isBlockedWarningDisplayed = () => {
        return connection?.isBlocked && currentUserAllowPublicAccess;
    };

    return (
        <div id={props.id} ref={mainDiv} className="modal fade" data-backdrop="static" tabIndex="-1" aria-labelledby="connectionDetailsLabel" aria-hidden="true">
            <div>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header card-header">
                            <h5 className="modal-title" id="connectionDetailsLabel">{connection?.displayName}<small className="text-muted">#{connection?.displayNameIndex}</small></h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" arial-label="close" onClick={handleCloseClick}></button>
                        </div>
                        <div className="modal-body">
                            <p className="text-center">
                                <img src={connection?.pfpSmall} className="border rounded-circle w-25" />
                            </p>
                            <div className="text-end">
                                <ConnectionButton uniqueId={connection?.uniqueId} />
                            </div>
                        </div>
                        <div className="modal-body card-body bg-warning justify-content-between" style={{display: isBlockedWarningDisplayed() ? '' : 'none'}}>
                            <small className="card-text">You have blocked this user but you are allowing public access, so they can still view your profile while logged out. Visit <a href="/settings">Settings</a> to change this.</small>
                        </div>
                        <div className="modal-footer card-footer justify-content-between">
                            <small><a href={`/u/${connection?.profileName}`}>View Profile</a></small>
                            <small style={{ display: connection?.isMutual ? '' : 'none'}}>🤝 This connection is mutual!</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}