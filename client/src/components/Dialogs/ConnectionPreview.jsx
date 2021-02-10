import React, {useState, useRef, useEffect} from 'react';
import classNames from 'classnames';
import { usePopper } from 'react-popper';
import SwitchCheckbox from '../FormControls/SwitchCheckbox';
import TwoClickButton from '../FormControls/TwoClickButton';
import { HtmlTooltip } from '../HtmlTooltip';
import ConnectionButton from '../FormControls/ConnectionButton';

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
    const [showConnectionTypesTooltip, setShowConnectionTypesTooltip] = useState(false);
    const mainDiv = useRef();

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

    const canUncheck = () => {
        if (props.selectedConnection?.details?.connectionTypes !== undefined) {
            let selectedCount = Object.values(props.selectedConnection?.details?.connectionTypes).reduce((total, current) => {
                return total + (current ? 1 : 0);
            }, 0);

            return selectedCount > 1;
        }

        return false;
    };

    const handleTypeChange = (event) => {
        let { name, checked } = event.target;

        if (!checked && !canUncheck()) {
            event.target.checked = true;
            setShowConnectionTypesTooltip(true);
        }
        else {
            setShowConnectionTypesTooltip(false);

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
        }

        event.stopPropagation();
    };

    const handleCloseClick = (event) => {
        props.saveSelectedConnection();
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
                            <h5 className="modal-title" id="connectionDetailsLabel">{props.selectedConnection?.details?.displayName}<small className="text-muted">#{props.selectedConnection?.details?.displayNameIndex}</small></h5>
                            <button type="button" className="btn-close" data-dismiss="modal" arial-label="close" onClick={handleCloseClick}></button>
                        </div>
                        <div className="modal-body">
                            <p className="text-center">
                                <img src={props.selectedConnection?.details.pfpSmall} className="border rounded-circle w-25" />
                            </p>
                            <div className="text-right">
                                <ConnectionButton connection={props.selectedConnection} />
                                <div ref={dropdownMenuContainer} className="dropdown">
                                    <button ref={setReferenceElement} type="button" className={classNames('btn', 'btn-outline-primary', 'dropdown-toggle', {'show': isDropdownOpen})} id="connectionTypeDropdownButton" onClick={toggleDropdown}>
                                        Relationship
                                    </button>
                                    <HtmlTooltip title="At least one connection type must be selected."
                                        enterDelay={500}
                                        disableHoverListener
                                        disableFocusListener 
                                        interactive
                                        placement="top"
                                        open={showConnectionTypesTooltip}
                                        color='rgb(255,0,0)'
                                    >
                                        <div ref={setPopperElement} className={classNames('dropdown-menu', 'px-2', {'show': isDropdownOpen})} style={styles.popper} {...styles.popper}>
                                            <div className="text-center mb-2">
                                                <TwoClickButton 
                                                    firstTitle="Remove Connection" 
                                                    secondTitle="Confirm Remove" 
                                                    className="btn btn-sm" 
                                                    firstClassName="btn-outline-danger" 
                                                    secondClassName="btn-outline-dark" 
                                                    progressClassName="bg-danger" 
                                                    firstTooltip={`Remove your connection to ${props.selectedConnection?.details?.displayName}#${props.selectedConnection?.details?.displayNameIndex}`}
                                                    secondTooltip={`Confirm you want to remove your connection to ${props.selectedConnection?.details?.displayName}#${props.selectedConnection?.details?.displayNameIndex}`}
                                                    secondDuration={5} 
                                                    onClick={(event) => {
                                                        closeDialog();
                                                        props.removeSelectedConnection();
                                                    }} 
                                                />
                                            </div>
                                            {
                                                props.selectedConnection
                                                ? Object.entries(props.selectedConnection.details.connectionTypes).map(([connectionType, details]) => (
                                                    <SwitchCheckbox key={connectionType} label={connectionType} isChecked={details} onSwitchChanged={handleTypeChange} />
                                                ))
                                                : <></>
                                            }
                                        </div>
                                    </HtmlTooltip>
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