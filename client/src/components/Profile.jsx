import React, {useState, useEffect} from 'react';
import Axios from 'axios';
import {withRouter} from 'react-router-dom';
import * as Constants from '../constants/constants';

function Profile(props) {
    const [username, setUsername] = useState('');

    useEffect(() => {
        Axios.get(Constants.BASE_API_URL + Constants.API_PATH_USERS + 'currentUsername').then(response => {
            if (response.data && response.data.username) {
                setUsername(response.data.username);
            }
        }, [username]);
    });

    return (
        <div>
            'My Profile'<br />
            <span style={{fontWeight: 'bold'}}>Email Address: </span>{username}
        </div>
    );
};

export default withRouter(Profile);