import React, {useEffect} from 'react';
import {withRouter} from 'react-router-dom';

function Welcome(props) {
    useEffect(() => {
        props.setTitle('Welcome!')
    }, []);

    return (
        <div>
            'Welcome!'
        </div>
    );
};

export default withRouter(Welcome);