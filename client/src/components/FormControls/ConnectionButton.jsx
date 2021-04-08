import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    postConnectionRemove,
    postConnectionUpdate
} from '../../redux/connections/connectionsSlice';

import {
    selectUserById,
    upsertUser
} from '../../redux/users/usersSlice';

import classNames from 'classnames';
import { usePopper } from 'react-popper';
import { HtmlTooltip } from '../HtmlTooltip';
import SwitchCheckbox from './SwitchCheckbox';
import TwoClickButton from './TwoClickButton';
import UserService from '../../services/user.service';

const ConnectionButton = ({
    uniqueId
}) => {
    // Redux
    const dispatch = useDispatch();
    const user = useSelector(state => selectUserById(state, uniqueId));

    const CS_BLOCKED = -1;
    const CS_NOT_CONNECTED = 0;
    const CS_CONNECT_PENDING = 1;
    const CS_CONNECTED = 2;
    
    const calculateInitialState = () => {
        let initialState = {
            isDropdownOpen: false,
            connectionState: determineConnectionState(),
            showConnectionTypesTooltip: false
        };
        
        return initialState;
    };

    const determineConnectionState = () => {
        if (user) {
            if (user.isBlocked) {
                return CS_BLOCKED;
            }
            else if (user.connectedToCurrentUser === true) {
                return CS_CONNECTED;
            }
        }

        return CS_NOT_CONNECTED;
    };

    const [referenceElement, setReferenceElement] = useState(null);
    const [popperElement, setPopperElement] = useState(null);
    const { styles, update } = usePopper(referenceElement, popperElement, {
        modifiers: [
        ],
        placement: 'bottom-start'
    });

    const dropdownMenuContainer = useRef();

    const [state, updateState] = useState(calculateInitialState);

    useEffect(() => {
        updateState(prevState => ({
            ...prevState,
            connectionState: determineConnectionState()
        }));
    }, [user?.uniqueId, user?.connectedToCurrentUser, user?.isBlocked]);

    useEffect(() => {
        if (state.isDropdownOpen) {
            document.addEventListener('click', hideDropdown);

            return function cleanup() {
                document.removeEventListener('click', hideDropdown);
            }
        }
        else {
            document.removeEventListener('click', hideDropdown);
        }
    }, [state.isDropdownOpen]);

    const hideDropdown = (event) => {
        if (dropdownMenuContainer && !dropdownMenuContainer.current.contains(event.target)) {
            handleDropdownClickOut(event);
        }       
    };

    const handleBlockClick = (event) => {
        // Send block to server for uniqueId
        UserService.blockUser(uniqueId); // Might be nice to alert the user if this fails

        dispatch(upsertUser({
            uniqueId,
            isBlocked: true
        }));
        
        // Update the state to blocked and close the dropdown
        updateState(prevState => ({
            ...prevState,
            connectionState: CS_BLOCKED,
            isDropdownOpen: false
        }));
    };

    // This handles the left side of the button, which is only shown when the user isn't connected or blocked
    const handleButtonClick = (event) => {
        if (state.connectionState === CS_NOT_CONNECTED) {
            update(); // This fixes the position of the dropdown menu

            // Set the state to pending and open the connection types dropdown
            updateState(prevState => ({
                ...prevState,
                connectionState: CS_CONNECT_PENDING,
                isDropdownOpen: true
            }));

            event.stopPropagation();
        }
    };
    
    const handleDropdownClickOut = async (event) => {
        // This should only fire if the dropdown is open due to how useEffect was set up

        // Need to close the dropdown
        let stateUpdates = {
            isDropdownOpen: false
        };

        switch (state.connectionState) {
            case CS_BLOCKED:
                // Don't need to do anything special, the dropdown shouldn't be open anyway, just let it close
                break;
            case CS_CONNECT_PENDING:
                // Determine if they checked any connection types
                const selectedConnectionTypeCount = getSelectedConnectionTypeCount();

                if (selectedConnectionTypeCount > 0) {
                    // If so, change state to CS_CONNECTED
                    stateUpdates.connectionState = CS_CONNECTED;

                    // and send info to server
                    let results = await dispatch(postConnectionUpdate(user));
                }
                else {
                    // Else, change state to CS_NOT_CONNECTED
                    stateUpdates.connectionState = CS_NOT_CONNECTED;
                }

                break;
            case CS_CONNECTED:
                // Send any connection type updates to the server
                let results = await dispatch(postConnectionUpdate(user));

                // Hide the connection types tooltip if it's shown
                stateUpdates.showConnectionTypesTooltip = false;

                break;
            case CS_NOT_CONNECTED:
            default:
                // Don't need to do anything special, since they wouldn't have chosen an action to take
                break;
        }

        updateState(prevState => ({
            ...prevState,
            ...stateUpdates
        }));
    };

    // This handles the right side of the button, which displays dropdowns and performs the unblock action
    const handleDropdownButtonClick = async (event) => {
        let stateUpdates = {};

        switch (state.connectionState) {
            case CS_BLOCKED:
                // Send unblock to server
                UserService.unblockUser(uniqueId); // Might be nice to alert the user if this fails

                dispatch(upsertUser({
                    uniqueId,
                    isBlocked: false
                }));

                // Update the state so it'll show the Add Connection appearance
                stateUpdates.connectionState = CS_NOT_CONNECTED;

                break;
            case CS_CONNECT_PENDING:
                // If open, determine if they checked any connection types
                if (state.isDropdownOpen) {
                    const selectedConnectionTypeCount = getSelectedConnectionTypeCount();

                    if (selectedConnectionTypeCount > 0) {
                        // If so, change state to CS_CONNECTED
                        stateUpdates.connectionState = CS_CONNECTED;

                        // and send info to server
                        let results = await dispatch(postConnectionUpdate(user));
                    }
                    else {
                        // Else, change state to CS_NOT_CONNECTED
                        stateUpdates.connectionState = CS_NOT_CONNECTED;
                    }
                }
                else {
                    update(); // This fixes the position of the dropdown menu
                }

                // Toggle the dropdown state
                stateUpdates.isDropdownOpen = !state.isDropdownOpen;

                event.stopPropagation();

                break;
            case CS_CONNECTED:
                if (state.isDropdownOpen) {
                    // Send any connection type updates to the server
                    let results = await dispatch(postConnectionUpdate(user));

                    // Hide the connection types tooltip if it's shown
                    stateUpdates.showConnectionTypesTooltip = false;
                }
                else {
                    update(); // This fixes the position of the dropdown menu
                }

                // Toggle the dropdown state
                stateUpdates.isDropdownOpen = !state.isDropdownOpen;

                event.stopPropagation();

                break;
            case CS_NOT_CONNECTED:
            default:
                update(); // This fixes the position of the dropdown menu

                // Toggle the dropdown state
                stateUpdates.isDropdownOpen = !state.isDropdownOpen;

                event.stopPropagation();

                break;
        }

        updateState(prevState => ({
            ...prevState,
            ...stateUpdates
        }));
    };

    const handleTypeChange = (event) => {
        let { name, checked } = event.target;

        if (!checked && !canUncheck()) {
            event.target.checked = true;

            updateState(prevState => ({
                ...prevState,
                showConnectionTypesTooltip: true
            }));
        }
        else {
            updateState(prevState => ({
                ...prevState,
                showConnectionTypesTooltip: false
            }));

            dispatch(upsertUser({
                uniqueId,
                connectionTypes: {
                    ...user.connectionTypes,
                    [name]: checked
                }
            }));
        }

        event.stopPropagation();
    };

    const getCurrentButtonTitle = () => {
        return state.connectionState === CS_NOT_CONNECTED ? 'Add Connection' : '';
    };

    const getCurrentDropdownButtonTitle = () => {
        switch (state.connectionState)
        {
            case CS_BLOCKED:
                return 'Unblock';
            case CS_CONNECT_PENDING:
                return 'Add Pending...'
            case CS_CONNECTED:
                return 'Relationship';
            case CS_NOT_CONNECTED:
            default:
                return 'Toggle Additional Options';
        }
    };

    const getCurrentTooltip = () => {
        switch (state.connectionState)
        {
            case CS_BLOCKED:
                return '';
            case CS_CONNECTED:
                return '';
            case CS_NOT_CONNECTED:
            case CS_CONNECT_PENDING:
            default:
                return 'Add a connection to this user';
        }
    };

    const getCurrentDropdownTooltip = () => {
        switch (state.connectionState)
        {
            case CS_BLOCKED:
                return 'Unblock this user';
            case CS_CONNECT_PENDING:
                return 'Select the types of relationship';
            case CS_CONNECTED:
                return 'Manage the types of relationship or remove this connection';
            case CS_NOT_CONNECTED:
            default:
                return 'Additional Options';
        }
    };

    const getMainDivStyle = () => {
        return state.connectionState !== CS_NOT_CONNECTED ? {
            display: 'inline-block'
        } : {};
    };

    const getMainDivClassName = () => {
        switch (state.connectionState)
        {
            case CS_BLOCKED:
            case CS_CONNECT_PENDING:
            case CS_CONNECTED:
                return '';
            case CS_NOT_CONNECTED:
            default:
                return 'btn-group';
        }
    };

    const getCurrentTooltipColor = () => {
        switch (state.connectionState)
        {
            case CS_CONNECT_PENDING:
            case CS_CONNECTED:
                return '';
            case CS_NOT_CONNECTED:
            case CS_BLOCKED:
            default:
                return 'rgb(25,135,84)';
        }
    };

    const getCurrentButtonClassName = () => {
        switch (state.connectionState)
        {
            case CS_CONNECT_PENDING:
            case CS_CONNECTED:
                return 'btn btn-outline-primary';
            case CS_NOT_CONNECTED:
            case CS_BLOCKED:                
            default:
                return 'btn btn-outline-success';
        }
    };

    const getCurrentDropdownButtonClassName = () => {
        switch (state.connectionState)
        {
            case CS_BLOCKED:
                return 'btn btn-outline-success';
            case CS_CONNECT_PENDING:
            case CS_CONNECTED:
                if (state.isDropdownOpen)
                {
                    return 'btn btn-outline-primary dropdown-toggle show';
                }

                return 'btn btn-outline-primary dropdown-toggle';
            case CS_NOT_CONNECTED:
            default:
                if (state.isDropdownOpen)
                {
                    return 'btn btn-outline-success dropdown-toggle dropdown-toggle-split show';
                }

                return 'btn btn-outline-success dropdown-toggle dropdown-toggle-split';
        }
    };

    const getCurrentListItems = () => {
        switch (state.connectionState)
        {
            case CS_BLOCKED:
                return <></>;
            case CS_CONNECT_PENDING:
                return user?.connectionTypes
                ? Object.entries(user.connectionTypes).map(([connectionType, details]) => (
                    <SwitchCheckbox key={connectionType} label={connectionType} isChecked={details} onSwitchChanged={handleTypeChange} useListItem />
                ))
                : <></>;
            case CS_CONNECTED:
                return (
                    <>
                        <li className="text-center mb-2">
                            <TwoClickButton 
                                firstTitle="Remove Connection" 
                                secondTitle="Confirm Remove" 
                                className="btn btn-sm" 
                                firstClassName="btn-outline-danger" 
                                secondClassName="btn-outline-dark" 
                                progressClassName="bg-danger" 
                                firstTooltip={`Remove your connection to ${user?.displayName}#${user?.displayNameIndex}`}
                                secondTooltip={`Confirm you want to remove your connection to ${user?.displayName}#${user?.displayNameIndex}`}
                                secondDuration={5} 
                                onClick={(event) => {
                                    updateState(prevState => ({
                                        ...prevState,
                                        connectionState: CS_NOT_CONNECTED,
                                        isDropdownOpen: false
                                    }));

                                    dispatch(postConnectionRemove(user));
                                }} 
                            />
                        </li>
                        {
                            user?.connectionTypes
                            ? Object.entries(user.connectionTypes).map(([connectionType, details]) => (
                                <SwitchCheckbox key={connectionType} label={connectionType} isChecked={details} onSwitchChanged={handleTypeChange} useListItem />
                            ))
                            : <></>
                        }
                    </>
                );
            case CS_NOT_CONNECTED:
            default:
                return (
                    <li>
                        <button type="button" className="dropdown-item" onClick={handleBlockClick}>Block User</button>
                    </li>
                );
        }
    };

    const getSelectedConnectionTypeCount = () => {
        let selectedCount = Object.values(user?.connectionTypes).reduce((total, current) => {
            return total + (current ? 1 : 0);
        }, 0);

        return selectedCount;
    };

    const canUncheck = () => {
        if (state.connectionState === CS_CONNECT_PENDING) {
            // When they're in the connect pending state, allow them to leave everything unchecked
            // That way, when they close the popup, it won't try to add the connection and will flip back to not connected
            return true;
        }
        else if (user?.connectionTypes !== undefined) {
            return getSelectedConnectionTypeCount() > 1;
        }

        return false;
    };

    return (
        <div 
            ref={dropdownMenuContainer} 
            className={getMainDivClassName()}
            style={getMainDivStyle()}
        >
            <HtmlTooltip 
                title={getCurrentTooltip()}
                enterDelay={500}
                arrow
                placement="top"
                color={getCurrentTooltipColor()}
            >
                <button
                    type="button"
                    className={getCurrentButtonClassName()}
                    style={{ display: state.connectionState ? 'none' : ''}}
                    onClick={handleButtonClick}
                >
                    {getCurrentButtonTitle()}
                </button>
            </HtmlTooltip>
            <HtmlTooltip 
                title={getCurrentDropdownTooltip()}
                enterDelay={500}
                arrow
                placement="top"
                color={getCurrentTooltipColor()}
            >
                <button ref={setReferenceElement} 
                    type="button" 
                    className={getCurrentDropdownButtonClassName()} 
                    onClick={handleDropdownButtonClick}
                >
                    <span className={state.connectionState ? '' : 'visually-hidden'}>
                        {getCurrentDropdownButtonTitle()}
                    </span>
                </button>
            </HtmlTooltip>
            <HtmlTooltip title="At least one connection type must be selected."
                enterDelay={500}
                disableHoverListener
                disableFocusListener 
                placement="top"
                open={state.showConnectionTypesTooltip}
                color='rgb(255,0,0)'
            >
                <ul ref={setPopperElement}
                    className={classNames('dropdown-menu', 'px-2', {'show': state.isDropdownOpen})}
                    style={styles.popper}
                    {...styles.popper}
                >
                    {
                        getCurrentListItems()
                    }
                </ul>
            </HtmlTooltip>
        </div>
    );
};

export default ConnectionButton;
