import React, {useState, useEffect} from 'react';
import axiosApi from '../services/axios-api';
import {withRouter} from 'react-router-dom';
import * as Constants from '../constants/constants';
import ProfilePictureUpload from './ProfilePictureUpload';

function Profile(props) {
    const [username, setUsername] = useState('');
    const [profilePic, setProfilePic] = useState('/i/s/pfpDefault.svgz');

    useEffect(() => {
        axiosApi.get(Constants.API_PATH_USERS + 'currentUsername').then(response => {
            if (response.data && response.data.username) {
                setUsername(response.data.username);
            }
        }, [username]);
    });

    useEffect(() => {
        props.setTitle('Profile')
    }, []);

    return (
        <div className="card col-8 col-md-4 mt-2 align-middle text-center">
            <div className="card-header">
                <ProfilePictureUpload profilePic={profilePic} setProfilePic={setProfilePic} />
            </div>
            <div className="card-body">
                <h5 className="card-title">Email Address:</h5>
                <p className="card-text">{username}</p>
            </div>
        </div>
    );
};

export default withRouter(Profile);