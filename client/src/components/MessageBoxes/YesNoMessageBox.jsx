import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

const YesNoMessageBox = forwardRef((props, ref) => {
    const messageBoxLabelId = props.id + 'Label';

    return (
        <div id={props.id} ref={ref} className="modal fade" tabIndex="-1" data-backdrop="static" data-bs-keyboard="false" aria-labelledby={messageBoxLabelId} aria-hidden="true">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title" id={messageBoxLabelId}>{props.caption}</h5>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="close" onClick={props.noCallback}></button>
                    </div>
                    <div className="modal-body">
                        <p>{props.message}</p>
                        {
                            props.subtext
                            ? <small>{props.subtext}</small> 
                            : ''
                        }
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-primary" data-bs-dismiss="modal" onClick={props.yesCallback}>Yes</button>
                        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" onClick={props.noCallback}>No</button>
                    </div>
                </div>
            </div>
        </div>
    );
});

YesNoMessageBox.propTypes = {
    id: PropTypes.string,
    caption: PropTypes.string,
    message: PropTypes.string,
    subtext: PropTypes.string,
    yesCallback: PropTypes.func,
    noCallback: PropTypes.func
};

export default YesNoMessageBox;