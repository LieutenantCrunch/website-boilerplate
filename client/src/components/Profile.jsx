import React, {useState, useEffect} from 'react';
import {withRouter} from 'react-router-dom';
import ProfilePictureUpload from './ProfilePictureUpload';
import NewPostForm from './NewPostForm';

// Redux
import { useSelector } from 'react-redux';
import { selectCurrentUserDisplayName, selectCurrentUserDisplayNameIndex, selectCurrentUserEmail } from '../redux/users/currentUserSlice';

function Profile(props) {
    const currentUserDisplayName = useSelector(selectCurrentUserDisplayName);
    const currentUserDisplayNameIndex = useSelector(selectCurrentUserDisplayNameIndex);
    const currentUserEmail = useSelector(selectCurrentUserEmail);

    useEffect(() => {
        props.setTitle('Profile');
    }, []);

    return (
        <>
            <div className="card col-12 col-sm-8 col-md-6 col-xl-4 mt-2 mb-2 align-middle text-center">
                <div className="card-header">
                    <ProfilePictureUpload />
                </div>
                <div className="card-body">
                    <h5 className="card-title">{currentUserDisplayName}
                        {
                            currentUserDisplayNameIndex > 0
                            ? <small className="text-muted">#{currentUserDisplayNameIndex}</small>
                            : <></>
                        }
                    </h5>
                    <p className="card-text">Email Address: {currentUserEmail}</p>
                </div>
            </div>
            <NewPostForm />
        </>
    );
};

export default withRouter(Profile);