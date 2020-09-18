import React, {useState, useEffect} from 'react';
import axiosApi from '../services/axios-api';
import {withRouter} from 'react-router-dom';
import * as Constants from '../constants/constants';
import ProfilePictureUpload from './ProfilePictureUpload';

function Profile(props) {
    // Create some local variables for accessing props for readability
    let userDetails = props.userDetails;
    let setUserDetails = props.setUserDetails;

    useEffect(() => {
        axiosApi.get(Constants.API_PATH_USERS + 'currentUserDetails').then(response => {
            if (response.data && response.data.success) {
                setUserDetails(response.data.userDetails);
            }
        })
    }, []);

    useEffect(() => {
        props.setTitle('Profile')
    }, []);

    const setProfilePic = pfp => {
        setUserDetails(userDetails => ({...userDetails, pfp}));
    };

    return (
        <div className="card col-8 col-md-4 mt-2 align-middle text-center">
            <div className="card-header">
                <ProfilePictureUpload profilePic={userDetails.pfp} setProfilePic={setProfilePic} />
            </div>
            <div className="card-body">
                <h5 className="card-title">{userDetails.displayName}
                    {
                        userDetails.displayNameIndex > 0
                        ? <small className="text-muted">#{userDetails.displayNameIndex}</small>
                        : <></>
                    }
                </h5>
                <p className="card-text">Email Address: {userDetails.email}</p>
            </div>
        </div>
    );
};

export default withRouter(Profile);