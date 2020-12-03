import React, {useState, useRef, useEffect} from 'react';
import classNames from 'classnames';
import { usePopper } from 'react-popper';
import SwitchCheckbox from '../FormControls/SwitchCheckbox';
import UserSearch from '../UserSearch';
import UserService from '../../services/user.service';

export default function AddConnectionDialog (props) {
    const [state, updateState] = useState({
        selectedUserDetails: null,
        connectionTypeDict: null
    });
    const dropdownMenuContainer = useRef();
    const [referenceElement, setReferenceElement] = useState(null);
    const [popperElement, setPopperElement] = useState(null);
    const { styles, update } = usePopper(referenceElement, popperElement, {
        modifiers: [
        ],
        placement: 'bottom-start'
    });
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const userSearch = useRef();

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

    const onUserSelect = async (selectedUserId) => {
        let selectedUserDetails = null;
        let connectionTypeDict = null;

        if (selectedUserId !== '') {
            selectedUserDetails = await UserService.getUserDetails(selectedUserId);
        }

        updateState(prevState => {
            return {...prevState, selectedUserDetails, connectionTypeDict};
        });
    }

    const toggleDropdown = (event) => {
        update(); // This fixes the position of the dropdown menu
        setIsDropdownOpen(!isDropdownOpen);
        event.stopPropagation();
    };

    const handleTypeChange = (event) => {

    };

    const clearSelectedUser = (event) => {
        updateState(prevState => {
            return {...prevState, selectedUserDetails: null};
        });

        userSearch.current.clearInput();
    };

    return (
        <div id={props.id} className="modal fade" data-backdrop="static" tabIndex="-1" aria-labelledby="connectionDetailsLabel" aria-hidden="true">
            <div>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header card-header">
                            <h5 className="modal-title" id="connectionDetailsLabel">Add New Connection</h5>
                            <button type="button" className="btn-close" data-dismiss="modal" arial-label="close" onClick={clearSelectedUser}></button>
                        </div>
                        <div className="modal-body card-body">
                            <UserSearch ref={userSearch} className="w-100" onUserSelect={onUserSelect} selectAllOnFocus={true} />
                        </div>
                        <div className="modal-body card-body" style={{
                                display: state.selectedUserDetails ? '' : 'none'
                            }}
                        >
                            <p className="text-center">
                                <img src={state.selectedUserDetails?.pfp} className="border rounded-circle w-25" />
                            </p>
                            <div className="text-center">
                                <h5 className="text-center">{state.selectedUserDetails?.displayName}<small className="text-muted">#{state.selectedUserDetails?.displayNameIndex}</small></h5>
                            </div>
                            <div className="text-right">
                                <div ref={dropdownMenuContainer} className="dropdown">
                                    <button ref={setReferenceElement} type="button" className={classNames('btn', 'btn-outline-primary', 'dropdown-toggle', {'show': isDropdownOpen})} id="connectionTypeDropdownButton" onClick={toggleDropdown}>
                                        Relationship
                                    </button>
                                    <div ref={setPopperElement} className={classNames('dropdown-menu', 'px-2', {'show': isDropdownOpen})} style={styles.popper} {...styles.popper}>
                                        {
                                            Object.entries(props.appState.connectionTypeDict).map(([connectionType, details]) => (
                                                <SwitchCheckbox key={connectionType} label={connectionType} isChecked={false} onSwitchChanged={handleTypeChange} />
                                            ))
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer card-footer">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}