import React, {useState, useEffect} from 'react';
import { useHistory } from 'react-router-dom';

export const useStateWithSessionStorage = (key, defaultValue) => {
    const [value, setValue] = useState(() => JSON.parse(sessionStorage.getItem(key)) || defaultValue);

    /* Pass [key, value] in the second parameter to useEffect so it becomes optimized and doesn't run unless value changes
        "If you use this optimization, make sure the array includes all values from the component scope (such as props and state) that change over time and that are used by the effect."
        https://reactjs.org/docs/hooks-effect.html
        */
    useEffect(() => {
        if (!value) {
            sessionStorage.removeItem(key);
        }
        else {
            sessionStorage.setItem(key, JSON.stringify(value))
        }
    }, [key, value]);

    return [value, setValue];
};

export const useStateWithLocalStorage = (key, defaultValue) => {
    const [value, setValue] = useState(() => JSON.parse(localStorage.getItem(key)) || defaultValue);

    /* Pass [key, value] in the second parameter to useEffect so it becomes optimized and doesn't run unless value changes
        "If you use this optimization, make sure the array includes all values from the component scope (such as props and state) that change over time and that are used by the effect."
        https://reactjs.org/docs/hooks-effect.html
        */
    useEffect(() => {
        if (!value) {
            localStorage.removeItem(key);
        }
        else {
            localStorage.setItem(key, JSON.stringify(value))
        }
    }, [key, value]);

    return [value, setValue];
};

// https://gal.hagever.com/posts/react-forms-and-history-state/
export const useHistoryState = (key, initialValue) => {
    const history = useHistory();

    const [rawState, rawSetState] = useState(() => {
        const value = history.location.state?.[key];
            return value ?? initialValue;
        }
    );

    const setState = (value) => {
        history.replace({
            ...history.location,
            state: {
                ...history.location.state,
                [key]: value
            }
        });

        rawSetState(value);
    }

    return [rawState, setState];
};

export const useMessageBoxState = initialState => {
    const [isOpen, setIsOpen] = useState(initialState.isOpen);
    const [messageBoxProps, setMessageBoxProps] = useState(initialState.messageBoxProps);

    const setMessageBoxState = ({ isOpen, messageBoxProps = {} }) => {
        setIsOpen(isOpen);
        setMessageBoxProps(messageBoxProps);
    };

    return [{ isOpen, messageBoxProps}, setMessageBoxState];
};
