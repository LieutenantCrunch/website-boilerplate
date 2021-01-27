import React, {useState, useEffect} from 'react';
import {withRouter} from 'react-router-dom';
import ProfilePictureUpload from './ProfilePictureUpload';

function Profile(props) {
    // Create some local variables for accessing props for readability
    //let userDetails = props.userDetails;
    //let setUserDetails = props.setUserDetails;

    useEffect(() => {
        props.setTitle('Profile');
    }, []);

    const setProfilePic = pfp => {
        props.setUserDetails(userDetails => ({...userDetails, pfp}));
    };

    return (
        <div className="card col-8 col-md-4 mt-2 align-middle text-center">
            <div className="card-header">
                <ProfilePictureUpload profilePic={props.userDetails.pfp} setProfilePic={setProfilePic} />
            </div>
            <div className="card-body">
                <h5 className="card-title">{props.userDetails.displayName}
                    {
                        props.userDetails.displayNameIndex > 0
                        ? <small className="text-muted">#{props.userDetails.displayNameIndex}</small>
                        : <></>
                    }
                </h5>
                <p className="card-text">Email Address: {props.userDetails.email}</p>
            </div>
        </div>
    );
};

export default withRouter(Profile);