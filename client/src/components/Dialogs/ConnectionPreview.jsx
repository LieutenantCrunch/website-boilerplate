import React, {useState, useRef, useEffect} from 'react';
import classNames from 'classnames';
import { usePopper } from 'react-popper';
import SwitchCheckbox from '../FormControls/SwitchCheckbox';

export default function ConnectionPreviewDialog (props) {
    const dropdownMenuContainer = useRef();
    const [referenceElement, setReferenceElement] = useState(null);
    const [popperElement, setPopperElement] = useState(null);
    const { styles, update } = usePopper(referenceElement, popperElement, {
        modifiers: [
        ],
        placement: 'bottom-start'
    });
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        document.addEventListener('click', hideDropdown);

        return function cleanup() {
            document.removeEventListener('click', hideDropdown);
        }
    }, []);

    const hideDropdown = (event) => {
        if (dropdownMenuContainer && !dropdownMenuContainer.current.contains(event.target)) {
            setIsDropdownOpen(false);
        }       
    };

    const toggleDropdown = (event) => {
        update(); // This fixes the position of the dropdown menu
        setIsDropdownOpen(!isDropdownOpen);
        event.stopPropagation();
    };

    const handleTypeChange = (event) => {
        let { name, checked } = event.target;

        props.updateSelectedConnection({
            ...props.selectedConnection,
            details: {
                ...props.selectedConnection.details,
                connectionTypes: {
                    ...props.selectedConnection.details.connectionTypes,
                    [name]: checked
                }
            }
        });

        event.stopPropagation();
    };

    const handleCloseClick = (event) => {
        props.saveSelectedConnection();
    };

    return (
        <div id={props.id} className="modal fade" data-backdrop="static" tabIndex="-1" aria-labelledby="connectionDetailsLabel" aria-hidden="true">
            <div>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header card-header">
                            <h5 className="modal-title" id="connectionDetailsLabel">{props.selectedConnection?.details.displayName}<small className="text-muted">#{props.selectedConnection?.details.displayNameIndex}</small></h5>
                            <button type="button" className="btn-close" data-dismiss="modal" arial-label="close" onClick={handleCloseClick}></button>
                        </div>
                        <div className="modal-body">
                            <p className="text-center">
                                <img src={props.selectedConnection?.details.pfpSmall} className="border rounded-circle w-25" />
                            </p>
                            <div className="text-right">
                                <div ref={dropdownMenuContainer} className="dropdown">
                                    <button ref={setReferenceElement} type="button" className={classNames('btn', 'btn-outline-primary', 'dropdown-toggle', {'show': isDropdownOpen})} id="connectionTypeDropdownButton" onClick={toggleDropdown}>
                                        Relationship
                                    </button>
                                    <div ref={setPopperElement} className={classNames('dropdown-menu', 'px-2', {'show': isDropdownOpen})} style={styles.popper} {...styles.popper}>
                                        {
                                            props.selectedConnection
                                            ? Object.entries(props.selectedConnection.details.connectionTypes).map(([connectionType, details]) => (
                                                <SwitchCheckbox key={connectionType} label={connectionType} isChecked={details} onSwitchChanged={handleTypeChange} />
                                            ))
                                            : <></>
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer card-footer justify-content-between">
                            <small><a href={`/u/${props.selectedConnection?.details.profileName}`}>View Profile</a></small>
                            <small style={{ display: props.selectedConnection?.details.isMutual ? '' : 'none'}}>🤝 This connection is mutual!</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}