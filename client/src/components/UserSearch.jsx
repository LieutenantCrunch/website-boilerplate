import React, {useState, useEffect, useRef} from 'react';
import classNames from 'classnames';

import UserService from '../services/user.service';

export default function UserSearch(props) {
    const autoFill = useRef();
    const userInput = useRef();
    const suggestions = useRef();

    const [searchSuggestions, setSearchSuggestions] = useState([]);


    const handleUserInput = async (event) => {
        let text = userInput.current.value.trim();

        let tempArray = [];

        if (text) {
            let results = await UserService.searchDisplayNameAndIndex(text);
            let firstMatch = true;
            
            if (results) {
                results.users.forEach(user => {
                    if (user.displayName.toUpperCase().startsWith(text.toUpperCase())) {
                        let displayName = user.displayName;

                        tempArray.push(<li key={user.uniqueID} className={classNames('list-group-item', {'active': firstMatch})}>{displayName}</li>);

                        if (firstMatch) {
                            autoFill.current.value = displayName;
                            userInput.current.value = displayName.substring(0, userInput.current.value.length); // This will adjust the capitalization of the input to match the results
                            firstMatch = false;
                        }
                    }
                });
            }

            console.log(text);
        }
        else {
            console.log('Empty');
        }

        if (!tempArray.length) {
            autoFill.current.value = text;
        }

        setSearchSuggestions(tempArray);
    };

    const handleUserInputKey = (event) => {
        if (event.key === 'ArrowRight') {
            let text = autoFill.current.value.trim();

            userInput.current.value = text;
            setSearchSuggestions([]);
            event.preventDefault();
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
            onKeyUp={handleUserInputKey} />
        </div>
        {
            searchSuggestions.length > 0
            ? <ul ref={suggestions} className='list-group w-100'>
                {searchSuggestions}
            </ul>
            : <></>
        }
    </div>;
}