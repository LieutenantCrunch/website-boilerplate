import React, {useState, useRef, useEffect} from 'react';
import classNames from 'classnames';
import ConnectionButton from '../FormControls/ConnectionButton';

export default function ConnectionPreviewDialog (props) {
    const mainDiv = useRef();

    const handleCloseClick = (event) => {
        props.saveConnection();
    };

    const closeDialog = () => {
        if (mainDiv.current) {
            let modal = bootstrap.Modal.getInstance(mainDiv.current);

            modal.hide();
        }
    };

    return (
        <div id={props.id} ref={mainDiv} className="modal fade" data-backdrop="static" tabIndex="-1" aria-labelledby="connectionDetailsLabel" aria-hidden="true">
            <div>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header card-header">
                            <h5 className="modal-title" id="connectionDetailsLabel">{props.connection?.displayName}<small className="text-muted">#{props.connection?.displayNameIndex}</small></h5>
                            <button type="button" className="btn-close" data-dismiss="modal" arial-label="close" onClick={handleCloseClick}></button>
                        </div>
                        <div className="modal-body">
                            <p className="text-center">
                                <img src={props.connection?.pfpSmall} className="border rounded-circle w-25" />
                            </p>
                            <div className="text-right">
                                <ConnectionButton connection={props.connection} />
                            </div>
                        </div>
                        <div className="modal-footer card-footer justify-content-between">
                            <small><a href={`/u/${props.connection?.profileName}`}>View Profile</a></small>
                            <small style={{ display: props.connection?.isMutual ? '' : 'none'}}>🤝 This connection is mutual!</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}