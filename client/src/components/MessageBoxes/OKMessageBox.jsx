import React from 'react';
import PropTypes from 'prop-types';

function OKMessageBox(props) {
    const messageBoxLabelId = props.id + 'Label';

    return (
        <div id={props.id} className="modal fade" tabIndex="-1" data-backdrop="static" data-keyboard="false" aria-labelledby={messageBoxLabelId} aria-hidden="true">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title" id={messageBoxLabelId}>{props.caption}</h5>
                        <button type="button" className="close" data-dismiss="modal" aria-label="close" onClick={props.okCallback}>
                            <span aria-hidden="true">&times;</span>
                        </button>
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
                        <button type="button" className="btn btn-primary" data-dismiss="modal" onClick={props.okCallback}>OK</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

OKMessageBox.propTypes = {
    id: PropTypes.string,
    caption: PropTypes.string,
    message: PropTypes.string,
    subtext: PropTypes.string,
    okCallback: PropTypes.func
};

export default OKMessageBox;