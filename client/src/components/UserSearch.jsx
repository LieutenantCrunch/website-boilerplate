import React, {useState, useEffect, useRef} from 'react';
import classNames from 'classnames';

import * as Constants from '../constants/constants';
import UserService from '../services/user.service';

export default function UserSearch(props) {
    const autoFill = useRef();
    const userInput = useRef();
    const suggestions = useRef();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [searchSuggestions, setSearchSuggestions] = useState([]);
    const [currentState, setCurrentState] = useState({
        pageNumber: 0,
        total: 0
    });

    // Need to update the textboxes based on the current value in the search suggestions, but need to wait until it's been changed so we don't go out of the array boundaries
    useEffect(() => {
        // Still check just to be safe
        if (currentIndex < searchSuggestions.length) {
            let currentSearchSuggestion = searchSuggestions[currentIndex];
            updateInputsFromDisplayName(currentSearchSuggestion.displayName, currentSearchSuggestion.displayNameIndex);
        }
    }, [currentIndex]);

    const handleUserInput = async (event) => {
        updateSearchSuggestions(event, false);
    }

    const updateInputsFromDisplayName = (displayName, displayNameIndex) => {
        let fullDisplayName = `${displayName}#${displayNameIndex}`;

        autoFill.current.value = fullDisplayName;
        userInput.current.value = fullDisplayName.substring(0, userInput.current.value.length); // This will adjust the capitalization of the input to match the results
    }

    const updateSearchSuggestions = async (event, fetchNextPage) => {
        let pageNumber = 0;

        if (fetchNextPage)  {
            pageNumber = currentState.pageNumber + 1;

            setCurrentState({
                ...currentState,
                pageNumber
            });
        }

        let text = userInput.current.value.trim();
        let searchResult = await UserService.searchDisplayNameAndIndex(text, pageNumber);
       
        // If the input is empty, it needs to go in here so it can clear out the autofil and suggestions
        // If the api request was cancelled, we don't want to go in here and update anything
        if (text === '' || searchResult.status !== Constants.USER_SEARCH_STATUS.CANCELLED) {
            setCurrentState({
                ...currentState,
                total: searchResult.results.total
            });

            let tempArray = [];
            let firstMatch = true;

            // If the search finished processing, update the auto fill and suggestions with whatever the first value is
            if (searchResult.status === Constants.USER_SEARCH_STATUS.RESULTS) {
                if (fetchNextPage)  {
                    tempArray = searchSuggestions.slice();
                }

                searchResult.results.users.forEach(user => {
                    let fullDisplayName = `${user.displayName}#${user.displayNameIndex}`;
                    if (fullDisplayName.toUpperCase().startsWith(text.toUpperCase())) {
                        let displayName = user.displayName;
                        let displayNameIndex = user.displayNameIndex;

                        //tempArray.push(<li key={user.uniqueID} className={classNames('list-group-item', {'active': firstMatch})}>{displayName}</li>);
                        tempArray.push({displayName, displayNameIndex, key: user.uniqueID})

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
    
            // Update the suggestions appropriately
            setSearchSuggestions(tempArray);

            // If the current index is invalid, reset it to 0
            if (currentIndex >= tempArray.length) {
                setCurrentIndex(0);
            }
        }
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
            case 'ArrowRight': 
                {
                    let text = autoFill.current.value.trim();

                    userInput.current.value = text;
                    setSearchSuggestions([]);
                    event.preventDefault();
                }
                break;
            case 'ArrowDown':
                {
                    let nextIndex = currentIndex + 1;

                    if (nextIndex === searchSuggestions.length && searchSuggestions.length < currentState.total) {
                        updateSearchSuggestions(undefined, true);
                        setCurrentIndex(nextIndex);
                    }
                    else {
                        nextIndex = nextIndex % searchSuggestions.length;
                        setCurrentIndex(nextIndex);
                    }

                    event.preventDefault();
                }
                break;
            case 'ArrowUp':
                {
                    let previousIndex = (currentIndex - 1) < 0 ? searchSuggestions.length - 1 : currentIndex - 1;

                    setCurrentIndex(previousIndex);
                    event.preventDefault();
                }
                break;
            default:
                break;
        }
    };

    return <div className={props.className} style={props.style}>
        <div className='w-100' style={{position: 'relative', height: '100%'}}>
            <input ref={autoFill} className='form-control w-100' type='text' style={{
                opacity: '50%'
            }}
            tabIndex="-1" />
            <input ref={userInput} className='form-control w-100' type='text' style={{
                backgroundColor: 'transparent',
                left: 0,
                position: 'absolute',
                top: 0
            }}
            onInput={handleUserInput}
            onKeyDown={handleUserInputKeyDown}
            onKeyUp={handleUserInputKeyUp} />
        </div>
        {
            searchSuggestions.length > 0
            ? <ul ref={suggestions} className='list-group w-100'>
                {
                    searchSuggestions.map((item, index) => <li key={item.key} className={classNames('list-group-item', {'active': index === currentIndex})}>{item.displayName + '#' + item.displayNameIndex}</li>)
                }
            </ul>
            : <></>
        }
    </div>;
}