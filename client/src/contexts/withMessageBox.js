// Based on: https://alexandrempsantos.com/draft__solve-modals-with-context-and-hooks/
import React, { createContext } from 'react';
import MessageBox from '../components/Dialogs/MessageBox';
import { useMessageBoxState } from '../hooks/hooks';

export const MessageBoxStateContext = createContext();
export const MessageBoxUpdaterContext = createContext();

export const WithMessageBox = ({ children }) => {
    const [messageBoxOptions, setMessageBoxOptions] = useMessageBoxState({
        isOpen: false,
        messageBoxProps: {}
    });

    return (
        <MessageBoxUpdaterContext.Provider value={setMessageBoxOptions}>
            <MessageBoxStateContext.Provider value={messageBoxOptions}>
                {children}
                <MessageBox />
            </MessageBoxStateContext.Provider>
        </MessageBoxUpdaterContext.Provider>
    );
};
