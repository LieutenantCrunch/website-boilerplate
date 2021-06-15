import React, {useEffect} from 'react';

export const Welcome = ({ setTitle }) => {
    useEffect(() => {
        setTitle('Welcome!')
    }, []);

    return (
        <div>
            'Welcome!'
        </div>
    );
};
