import React, {useState, useEffect, useRef} from 'react';
import classNames from 'classnames';
import scrollIntoView from 'scroll-into-view-if-needed';

import * as Constants from '../constants/constants';
import UserService from '../services/user.service';

const UserSearch = (props) => {
    const autoFill = useRef();
    const userInput = useRef();
    const suggestions = useRef();
    const fetchMoreResults = useRef();

    const [currentIndex, setCurrentIndex] = useState({index: 0, scrollToTop: true});
    const [searchSuggestions, setSearchSuggestions] = useState([]);
    const [currentState, setCurrentState] = useState({
        pageNumber: 0,
        total: 0
    });

    const [state, updateState] = useState({
        currentIndex: 0,
        scrollToTop: true,
        searchSuggestions: [],
        pageNumber: 0,
        total: 0
    });

    // Intersection Observer testing
    const intersectionObserverOptions = {
        root: suggestions.current, /* Want the suggestions <ul> to be the root element */
        rootMargin: '0px', /* No margin */
        threshold: 1.0 /* Want the callback to be called when the child is fully visible/hidden */
    };

    const intersectionObserverCB = (entries) => {
        entries.forEach(entry => {
            // If the entry is the fetchMoreResults <li>
            if (fetchMoreResults.current && entry.target === fetchMoreResults.current) {
                let el = fetchMoreResults.current;

                // And it's visible, meaning they scrolled down to see it
                if (el.className.indexOf('d-none') === -1 && entry.isIntersecting) {
                    // Go fetch more results.
                    // Problem: searchSuggestions is blown out at this point
                    updateSearchSuggestions(undefined, true);
                }
            }
        });
    };

    const intersectionObserver = useRef();

    useEffect(() => {
        if (fetchMoreResults.current && suggestions.current && !intersectionObserver.current) {
            intersectionObserver.current = new IntersectionObserver(intersectionObserverCB, {
                root: suggestions.current, /* Want the suggestions <ul> to be the root element */
                rootMargin: '0px', /* No margin */
                threshold: 1.0 /* Want the callback to be called when the child is fully visible/hidden */
            });

            intersectionObserver.current.observe(fetchMoreResults.current);
        }
    }, []);
    // End Intersection Observer testing

    // This needs to be a ref so it hangs around between renders
    const listItemRefs = useRef({});

    // Need to update the textboxes based on the current value in the search suggestions, but need to wait until it's been changed so we don't go out of the array boundaries
    useEffect(() => {
        // Still check just to be safe
        if (currentIndex.index < searchSuggestions.length) {
            let currentSearchSuggestion = searchSuggestions[currentIndex.index];
            updateInputsFromDisplayName(currentSearchSuggestion.displayName, currentSearchSuggestion.displayNameIndex);

            let currentItemRef = listItemRefs.current[currentSearchSuggestion.key];

            if (currentItemRef) {
                scrollIntoView(currentItemRef.current, {block: (currentIndex.scrollToTop ? 'start' : 'end'), scrollMode: 'if-needed'});
            }
        }
    }, [currentIndex.index, searchSuggestions]);

    const handleUserInput = async (event) => {
        updateSearchSuggestions(event, false);
    }

    const updateInputsFromDisplayName = (displayName, displayNameIndex) => {
        let fullDisplayName = `${displayName}#${displayNameIndex}`;

        autoFill.current.value = fullDisplayName;
        userInput.current.value = fullDisplayName.substring(0, userInput.current.value.length); // This will adjust the capitalization of the input to match the results
    }

    const moreResultsAvailable = () => {
        return (searchSuggestions.length < currentState.total);
    };

    const updateSearchSuggestions = async (event, fetchNextPage) => {
        let updateObject = {};
        let pageNumber = 0;

        if (fetchNextPage)  {
            pageNumber = currentState.pageNumber + 1;
            console.log(`${Date.now()} Fetch page ${pageNumber}`);
            updateObject.pageNumber = pageNumber;
        }

        let text = userInput.current.value.trim();
        let searchResult = await UserService.searchDisplayNameAndIndex(text, pageNumber);
       
        // If the input is empty, it needs to go in here so it can clear out the autofil and suggestions
        // If the api request was cancelled, we don't want to go in here and update anything
        if (text === '' || searchResult.status !== Constants.USER_SEARCH_STATUS.CANCELLED) {
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

            listItemRefs.current = tempArray.reduce((accumulator, currentItem) => {
                accumulator[currentItem.key] = React.createRef();
                return accumulator;
            }, {});
    
            // Update the suggestions appropriately
            console.log(`${Date.now()} setSearchSuggestions`);
            //setSearchSuggestions(tempArray);
            setSearchSuggestions(prevSuggestions => {
                prevSuggestions.splice(0, prevSuggestions.length);
                return [...prevSuggestions, ...tempArray];
            });
            updateObject.searchSuggestions = tempArray.slice();

            // If the current index is invalid, reset it to 0
            if (currentIndex.index >= tempArray.length) {
                console.log(`${Date.now()} setCurrentIndex`);
                //setCurrentIndex({index: 0, scrollToTop: true});
                setCurrentIndex(prevCurrentIndex => {
                    return {...prevCurrentIndex, index: 0, scrollToTop: true};
                });
                updateObject.currentIndex = 0;
                updateObject.scrollToTop = true;
            }
        }

        updateObject.total = searchResult.results.total;

        console.log(`${Date.now()} setCurrentState`);
        /*setCurrentState({
            pageNumber,
            total: searchResult.results.total
        });*/
        setCurrentState(prevState => {
            return {...prevState, pageNumber, total: searchResult.results.total};
        });
        
        updateState(prevState => {
            prevState.searchSuggestions.splice(0, prevState.searchSuggestions.length);

            return {...prevState, ...updateObject};
        });
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
                    let nextIndex = currentIndex.index + 1;

                    if (nextIndex === searchSuggestions.length && moreResultsAvailable()) {
                        updateSearchSuggestions(undefined, true);
                        setCurrentIndex({index: nextIndex, scrollToTop: false});
                    }
                    else {
                        nextIndex = nextIndex % searchSuggestions.length;
                        setCurrentIndex({index: nextIndex, scrollToTop: nextIndex === 0});
                    }

                    event.preventDefault();
                }
                break;
            case 'ArrowUp':
                {
                    let isLoop = (currentIndex.index - 1) < 0;
                    let previousIndex = isLoop ? searchSuggestions.length - 1 : currentIndex.index - 1;

                    setCurrentIndex({index: previousIndex, scrollToTop: !isLoop});
                    event.preventDefault();
                }
                break;
            default:
                break;
        }
    };

    console.log(`${Date.now()} UserSearch rendered`);

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
        <ul ref={suggestions} className={classNames('list-group', 'w-100', 'mb-10', {'d-none': searchSuggestions.length === 0})} style={{maxHeight:'241px', overflowY: `${moreResultsAvailable() ? 'scroll' : 'auto'}`}}>
            {
                searchSuggestions.map((item, index) => <li key={item.key} ref={listItemRefs.current[item.key]} className={classNames('list-group-item', {'active': index === currentIndex.index})} style={{maxHeight: '40px'}}>{item.displayName + '#' + item.displayNameIndex}</li>)
            }
            <li className={classNames('list-group-item', 'text-center', 'font-weight-bold', 'text-no-wrap', {'d-none': !moreResultsAvailable()})}>More results below...</li>
            <li ref={fetchMoreResults} className={classNames('list-group-item', 'm-0', 'p-0', {'d-none': !moreResultsAvailable()})} style={{height: '2px', backgroundColor: 'red'}}>&nbsp;</li>
        </ul>
    </div>;
};

export default React.memo(UserSearch);
