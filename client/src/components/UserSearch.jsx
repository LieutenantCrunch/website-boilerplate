import React, {forwardRef, useState, useEffect, useImperativeHandle, useRef} from 'react';
import classNames from 'classnames';
import scrollIntoView from 'scroll-into-view-if-needed';
import {isMobile} from 'react-device-detect';

import * as Constants from '../constants/constants';
import UserService from '../services/user.service';

/**
 * A text input component for searching users. Has autocomplete functionality, mostly triggered by keyboard inputs. Exposes a method clearInput() for clearing the input from a parent component. To use, set a ref on this component and call clearInput() on the ref.
 */
const UserSearch = forwardRef((props, ref) => {
    const container = useRef();
    const autoFill = useRef();
    const userInput = useRef();
    const suggestions = useRef();

    // This needs to be a ref so it hangs around between renders
    const listItemRefs = useRef({});

    useImperativeHandle(ref, () => ({
        /**
         * Clears the current value in the input
         */
        clearInput() {
            autoFill.current.value = '';
            userInput.current.value = '';
        }
    }));

    const [state, updateState] = useState({
        currentIndex: 0,
        scrollToTop: true,
        searchSuggestions: [],
        pageNumber: 0,
        total: 0,
        fetchTrigger: Constants.USER_SEARCH_TRIGGER.KEYBOARD,
        selectedUserId: ''
    });

    const initialState = Object.freeze({
        currentIndex: 0,
        scrollToTop: true,
        searchSuggestions: [],
        pageNumber: 0,
        total: 0,
        fetchTrigger: Constants.USER_SEARCH_TRIGGER.KEYBOARD,
        selectedUserId: ''
    });

    const hideSearchSuggestions = (event) => {
        if (container.current && !container.current.contains(event.target)) {
            updateState(prevState => {
                return {...prevState, ...initialState};
            });

            if (autoFill.current && userInput.current && autoFill.current.value.trim() !== userInput.current.value) {
                autoFill.current.value = userInput.current.value = '';
            }
        }
    }

    useEffect(() => {
        document.addEventListener('click', hideSearchSuggestions);

        return function cleanup() {
            document.removeEventListener('click', hideSearchSuggestions);
        }
    }, []);

    // Need to update the textboxes based on the current value in the search suggestions, but need to wait until it's been changed so we don't go out of the array boundaries
    useEffect(() => {
        // Still check just to be safe
        if (state.currentIndex < state.searchSuggestions.length) {
            let currentSearchSuggestion = state.searchSuggestions[state.currentIndex];
            updateInputsFromDisplayName(currentSearchSuggestion.displayName, currentSearchSuggestion.displayNameIndex);

            let currentItemRef = listItemRefs.current[currentSearchSuggestion.key];

            if (currentItemRef && state.fetchTrigger === Constants.USER_SEARCH_TRIGGER.KEYBOARD) {
                scrollIntoView(currentItemRef.current, {block: (state.scrollToTop ? 'start' : 'end'), scrollMode: 'if-needed'});
            }
        }
    }, [state.currentIndex, state.searchSuggestions]);

    const updateInputsFromDisplayName = (displayName, displayNameIndex) => {
        let fullDisplayName = `${displayName}#${displayNameIndex}`;

        autoFill.current.value = fullDisplayName;
        userInput.current.value = fullDisplayName.substring(0, userInput.current.value.length); // This will adjust the capitalization of the input to match the results
    }

    const moreResultsAvailable = () => {
        return (state.searchSuggestions.length < state.total);
    };

    const updateSearchSuggestions = async (event, fetchNextPage, additionalUpdates = undefined) => {
        let updateObject = {};
        let pageNumber = 0;

        if (fetchNextPage)  {
            pageNumber = state.pageNumber + 1;
            updateObject.pageNumber = pageNumber;
        }

        let text = userInput.current.value.trim();
        let searchResult = await UserService.searchDisplayNameAndIndex(text, pageNumber, props.excludeConnections);
       
        // If the input is empty, it needs to go in here so it can clear out the autofil and suggestions
        // If the api request was cancelled, we don't want to go in here and update anything
        if (text === '' || searchResult.status !== Constants.USER_SEARCH_STATUS.CANCELLED) {
            let tempArray = [];
            let firstMatch = true;

            // If the search finished processing, update the auto fill and suggestions with whatever the first value is
            if (searchResult.status === Constants.USER_SEARCH_STATUS.RESULTS) {
                if (fetchNextPage)  {
                    tempArray = state.searchSuggestions.slice();
                }

                searchResult.results.users.forEach(user => {
                    let fullDisplayName = `${user.displayName}#${user.displayNameIndex}`;
                    if (fullDisplayName.toUpperCase().startsWith(text.toUpperCase())) {
                        let displayName = user.displayName;
                        let displayNameIndex = user.displayNameIndex;

                        //tempArray.push(<li key={user.uniqueId} className={classNames('list-group-item', {'active': firstMatch})}>{displayName}</li>);
                        tempArray.push({displayName, displayNameIndex, key: user.uniqueId, pfpSmall: user.pfpSmall});

                        if (firstMatch) {
                            updateInputsFromDisplayName(displayName, displayNameIndex);
                            firstMatch = false;
                        }
                    }
                });
            }

            // If there are no suggestions, make sure the autofill gets set to whatever the user input
            if (tempArray.length === 0) {
                autoFill.current.value = text;
            }

            listItemRefs.current = tempArray.reduce((accumulator, currentItem) => {
                accumulator[currentItem.key] = React.createRef();
                return accumulator;
            }, {});
    
            // Update the suggestions appropriately
            updateObject.searchSuggestions = tempArray.slice();

            // If the current index is invalid, reset it to 0
            if (state.currentIndex >= tempArray.length) {
                updateObject.currentIndex = 0;
                updateObject.scrollToTop = true;
            }
        }

        updateObject.total = searchResult.results.total;

        /* This may not be the best place to catch this, may want to put it in the input handler like the other two calls to onUserSelect */
        if (text === '') {
            updateObject.selectedUserId = '';

            if (props.onUserSelect) {
                props.onUserSelect(text);
            }
        }

        if (additionalUpdates !== undefined) {
            updateObject = {...updateObject, ...additionalUpdates};
        }

        updateState(prevState => {
            prevState.searchSuggestions.splice(0, prevState.searchSuggestions.length);

            return {...prevState, ...updateObject};
        });
    };

    const handleUserInputFocus = (event) => {
        if (props.selectAllOnFocus) {
            event.target.select();
        }
    };

    const handleUserInput = (event) => {
        updateSearchSuggestions(event, false, {fetchTrigger: Constants.USER_SEARCH_TRIGGER.KEYBOARD});
    };

    const handleUserInputKeyDown = (event) => {
        switch (event.key) {
            case 'ArrowDown':
                // Prevent the text cursor from moving to the right
                event.preventDefault();
                break;
            case 'ArrowUp':
                // Prevent the text cursor from moving to the left
                event.preventDefault();
                break;
            default:
                break;
        }
    };

    const handleUserInputKeyUp = (event) => {
        switch (event.key) {
            case 'Enter':
                {
                    let text = autoFill.current.value.trim();

                    userInput.current.value = text;

                    let selectedUserId = state.searchSuggestions[state.currentIndex].key;

                    updateState(prevState => {
                        return {...prevState, ...initialState, selectedUserId};
                    });

                    if (props.onUserSelect) {
                        props.onUserSelect(selectedUserId);
                    }

                    event.preventDefault();
                }
                break;
            case 'ArrowRight': 
                {
                    let text = autoFill.current.value.trim();

                    userInput.current.value = text;

                    event.preventDefault();
                }
                break;
            case 'ArrowDown':
                {
                    let nextIndex = state.currentIndex + 1;

                    if (nextIndex === state.searchSuggestions.length && moreResultsAvailable()) {
                        updateSearchSuggestions(event, true, {currentIndex: nextIndex, scrollToTop: false, fetchTrigger: Constants.USER_SEARCH_TRIGGER.KEYBOARD});
                    }
                    else {
                        nextIndex = nextIndex % state.searchSuggestions.length;
                        updateState(prevState => {
                            return {...prevState, currentIndex: nextIndex, scrollToTop: nextIndex === 0};
                        });
                    }

                    event.preventDefault();
                }
                break;
            case 'ArrowUp':
                {
                    let isLoop = (state.currentIndex - 1) < 0;
                    let previousIndex = isLoop ? state.searchSuggestions.length - 1 : state.currentIndex - 1;

                    updateState(prevState => {
                        return {...prevState, currentIndex: previousIndex, scrollToTop: !isLoop};
                    })
                    event.preventDefault();
                }
                break;
            default:
                break;
        }
    };

    const handleSuggestionClick = (event) => {
        let text = autoFill.current.value.trim();

        userInput.current.value = text;

        let selectedUserId = state.searchSuggestions[state.currentIndex].key;

        updateState(prevState => {
            return {...prevState, ...initialState, selectedUserId};
        });

        if (props.onUserSelect) {
            props.onUserSelect(selectedUserId);
        }
    };

    const handleSuggestionMouseEnter = (event) => {
        let listItem = event.target;
        let suggestionIndex = listItem.dataset.suggestionIndex;

        if (suggestionIndex !== undefined) {
            try {
                let currentIndex = parseInt(suggestionIndex);

                updateState(prevState => {
                    return {...prevState, currentIndex};
                });
            }
            catch (err) {
                console.error(`Error parsing index (${suggestionIndex}):\n${err.message}`);
            }
        }
    };

    const handleMoreResultsClick = (event) => {
        updateSearchSuggestions(event, true, {fetchTrigger: Constants.USER_SEARCH_TRIGGER.MOUSE});
    };

    return <div ref={container} className={classNames('text-left', props.className)} style={{...props.style, position: 'relative'}}>
        <div className='w-100' style={{position: 'relative', height: '100%'}}>
            <input ref={autoFill} 
                className='form-control w-100' 
                type='text' 
                style={{
                    opacity: '50%'
                }}
                tabIndex="-1"

            />
            <input ref={userInput} 
                className='form-control w-100' 
                type='text' 
                style={{
                    backgroundColor: 'transparent',
                    left: 0,
                    position: 'absolute',
                    top: 0
                }}
                placeholder='Search users...'
                onFocus={handleUserInputFocus}
                onInput={handleUserInput}
                onKeyDown={handleUserInputKeyDown}
                onKeyUp={handleUserInputKeyUp} 
            />
        </div>
        <ul ref={suggestions} 
            className={classNames('list-group', 'w-100', 'mb-10', {'d-none': state.searchSuggestions.length === 0})} 
            style={{maxHeight:'300px', position: 'absolute', zIndex: 10, overflowY: `${moreResultsAvailable() ? 'scroll' : 'auto'}`}}
        >
            {
                state.searchSuggestions.map((item, index) => {
                    return (
                        <li key={item.key} 
                            ref={listItemRefs.current[item.key]} 
                            className={classNames('list-group-item', {'active': index === state.currentIndex})} 
                            style={{
                                cursor: 'pointer'
                            }}
                            onClick={handleSuggestionClick}
                            onMouseEnter={handleSuggestionMouseEnter}
                            data-suggestion-index={index}
                        >
                            <img src={item.pfpSmall}
                                className={'border-0 rounded-circle mr-1'}
                                style={{
                                    maxWidth: '5%'
                                }}
                            />
                            {item.displayName + '#' + item.displayNameIndex}
                        </li>
                    );
                })
            }
            <li key="More Results" className={classNames('list-group-item', 'text-center', 'p-0', {'d-none': !moreResultsAvailable()})}>
                <button className="btn btn-link btn-sm text-nowrap text-truncate shadow-none" 
                    type="button"
                    onClick={handleMoreResultsClick}
                >
                    {isMobile ? 'Tap' : 'Click'} here for more results
                </button>
            </li>
        </ul>
    </div>;
});

export default React.memo(UserSearch);
