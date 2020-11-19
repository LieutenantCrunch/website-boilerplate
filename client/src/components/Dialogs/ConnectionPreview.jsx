import React, {useState, useRef, useEffect} from 'react';
import SwitchCheckbox from '../FormControls/SwitchCheckbox';

export default function ConnectionPreviewDialog (props) {
    const modalRootEl = useRef();
    const connectionTypeDropdown = useRef();
    const connectionTypeDropdownBtn = useRef();
    const [test, setTest] = useState(null);

    // These are loading right away and not when the component is first shown
    // Maybe hook the event up on the modal show
    // Need to pass appState down through
    const fetchConnectionTypes = async () => {
        props.fetchConnectionTypes();
    };

    useEffect(() => {
        if (connectionTypeDropdown.current) {
            connectionTypeDropdown.current.addEventListener('hidden.bs.dropdown', connectionTypeDropdownHidden);
            connectionTypeDropdown.current.addEventListener('hide.bs.dropdown', connectionTypeDropdownHide);
        }

        return function cleanup() {
            if (connectionTypeDropdown.current) {
                connectionTypeDropdown.current.removeEventListener('hidden.bs.dropdown', connectionTypeDropdownHidden);
                connectionTypeDropdown.current.removeEventListener('hide.bs.dropdown', connectionTypeDropdownHide);
            }
        }
    }, [connectionTypeDropdown.current]);

    useEffect(() => {
        if (connectionTypeDropdownBtn.current) {
            setTest(new bootstrap.Dropdown(connectionTypeDropdownBtn.current, {}));
        }

        return function cleanup() {
            if (connectionTypeDropdownBtn.current) {
                setTest(null);
            }
        }
    }, [connectionTypeDropdownBtn.current]);

    useEffect(() => {
        if (modalRootEl.current) {
            modalRootEl.current.addEventListener('show.bs.modal', fetchConnectionTypes);
        }

        return function cleanup() {
            if (modalRootEl.current) {
                modalRootEl.current.removeEventListener('show.bs.modal', fetchConnectionTypes);
            }
        }
    }, [modalRootEl.current])

    const connectionTypeDropdownHide = (event) => {
        console.log('Closing');

        let test = props;
        console.log(test);
    };

    const connectionTypeDropdownHidden = (event) => {
        console.log('Closed');

        let test = props;
        console.log(test);
    };

    const handleTypeChange = (event) => {
        console.log('Switch clicked');
        console.log(event.target);
        event.stopPropagation();
    };

    return (
        <div id={props.id} ref={modalRootEl} className="modal fade" data-backdrop="static" tabIndex="-1" aria-labelledby="connectionDetailsLabel" aria-hidden="true">
            <div>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header card-header">
                            <h5 className="modal-title" id="connectionDetailsLabel">{props.selectedConnection?.displayName}<small className="text-muted">#{props.selectedConnection?.displayNameIndex}</small></h5>
                            <button type="button" className="btn-close" data-dismiss="modal" arial-label="close"></button>
                        </div>
                        <div className="modal-body">
                            <p className="text-center">
                                <img src={props.selectedConnection?.pfpSmall} className="border rounded-circle w-25" />
                            </p>
                            <div className="text-right">
                                <div ref={connectionTypeDropdown} className="dropdown">
                                    <button type="button" className="btn btn-outline-primary dropdown-toggle" id="connectionTypeDropdownButton">
                                        Relationship
                                    </button>
                                    <div className="dropdown-menu px-2">
                                        {
                                            Object.entries(props.appState.connectionTypes).map(([connectionType, details]) => (
                                                <SwitchCheckbox key={connectionType} label={connectionType} isChecked={props.selectedConnection.connectionTypes[connectionType]} onSwitchChanged={handleTypeChange} />
                                            ))
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer card-footer">
                            <small style={{ display: props.selectedConnection?.isMutual ? '' : 'none'}}>🤝 This connection is mutual!</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}