import React from 'react';
import {withRouter} from 'react-router-dom';

function Welcome(props) {
    return (
        <div>
            'Welcome!'
        </div>
    );
};

export default withRouter(Welcome);