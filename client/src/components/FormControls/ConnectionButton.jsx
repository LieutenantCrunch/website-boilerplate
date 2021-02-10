import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { usePopper } from 'react-popper';
import { HtmlTooltip } from '../HtmlTooltip';

const ConnectionButton = ({ 
    connection
}) => {
    const CS_BLOCKED = -1;
    const CS_NOT_CONNECTED = 0;
    const CS_CONNECT_PENDING = 1;
    const CS_CONNECTED = 2;
    
    const calculateInitialState = () => {
        let initialState = {
            isDropdownOpen: false,
            connectionState: determineConnectionState()
        };
        
        return initialState;
    };

    const determineConnectionState = () => {
        if (connection) {
            if (connection.isBlocked) {
                return CS_BLOCKED;
            }
            else if (connection.details?.connectionTypes !== undefined) {
                let hasOneConnectionType = Object.values(connection.details.connectionTypes).find(element => element) || false;

                if (hasOneConnectionType) {
                    return CS_CONNECTED;
                }
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
    }, [connection]);

    const handleBlockClick = (event) => {
        // Send block to server for uniqueId
        
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
    
    // This handles the right side of the button, which displays dropdowns and performs the unblock action
    const handleDropdownButtonClick = (event) => {
        switch (state.connectionState) {
            case CS_BLOCKED:
                // Send unblock to server

                // Update the state so it'll show the Add Connection appearance
                updateState(prevState => ({
                    ...prevState,
                    connectionState: CS_NOT_CONNECTED
                }));

                break;
            case CS_CONNECT_PENDING:
                let stateUpdates = {
                    isDropdownOpen: !state.isDropdownOpen
                };

                // If open, determine if they checked any connection types
                if (state.isDropdownOpen) {
                    const selectedConnectionTypeCount = getSelectedConnectionTypeCount();

                    if (selectedConnectionTypeCount > 0) {
                        // If so, change state to CS_CONNECTED
                        stateUpdates.connectionState = CS_CONNECTED;

                        // and send info to server
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
                updateState(prevState => ({
                    ...prevState,
                    ...stateUpdates
                }));

                event.stopPropagation();

                break;
            case CS_CONNECTED:
                update(); // This fixes the position of the dropdown menu

                // Remove connection closes the dropdown and the window, so probably don't need to worry about handling that
                // Send any connection type updates to the server
                //UserService.updateOutgoingConnection({ [connection.id]: state.selectedConnection.details });

                // Toggle the dropdown state
                updateState(prevState => ({
                    ...prevState,
                    isDropdownOpen: !prevState.isDropdownOpen
                }));

                event.stopPropagation();

                break;
            case CS_NOT_CONNECTED:
            default:
                update(); // This fixes the position of the dropdown menu

                // Toggle the dropdown state
                updateState(prevState => ({
                    ...prevState,
                    isDropdownOpen: !prevState.isDropdownOpen
                }));

                event.stopPropagation();

                break;
        }

        if (state.connectionState !== CS_BLOCKED) {
            
        }
        else {
            
        }
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
                return 'btn btn-outline-primary dropdown-toggle';
            case CS_NOT_CONNECTED:
            default:
                return 'btn btn-outline-success dropdown-toggle dropdown-toggle-split';
        }
    };

    const getCurrentListItems = () => {
        switch (state.connectionState)
        {
            case CS_BLOCKED:
                return <></>;
            case CS_CONNECT_PENDING:
            case CS_CONNECTED:
                return (
                    <li>'Connection Types'</li>
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
        let selectedCount = Object.values(connection?.details?.connectionTypes).reduce((total, current) => {
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
        else if (connection?.details?.connectionTypes !== undefined) {
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
                interactive
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
                interactive
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
            <ul ref={setPopperElement}
                className={classNames('dropdown-menu', 'px-2', {'show': state.isDropdownOpen})}
                style={styles.popper}
                {...styles.popper}
            >
                {
                    getCurrentListItems()
                }
            </ul>
        </div>
    );
};

export default ConnectionButton;