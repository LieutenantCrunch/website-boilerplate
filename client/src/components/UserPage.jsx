import React, { useEffect, useRef, useState } from 'react';
import { Redirect, Route, useParams, useRouteMatch, withRouter } from 'react-router-dom';
import classNames from 'classnames';

import ProfilePicture from './ProfilePicture';
import UserService from '../services/user.service';
import ConnectionButton from './FormControls/ConnectionButton';

import { upsertUser } from '../redux/users/usersSlice';
import { useDispatch } from 'react-redux';

function User (props) {
    const dispatch = useDispatch();
    const { profileName } = useParams();
    const [state, updateState] = useState({
        profileInfo: null
    });

    const updateConnection = (connection) => {
        updateState(prevState => ({
            ...prevState,
            profileInfo: connection
        }));
    }

    useEffect(() => {
        UserService.getProfileInfo(profileName).then((profileInfo) => {
            dispatch(upsertUser(profileInfo));

            let title = profileInfo.displayName;

            if (profileInfo.displayNameIndex > 0) {
                title += `#${profileInfo.displayNameIndex}`;
            }

            props.setTitle(`${title}'s Profile`);

            updateState(prevState => ({
                ...prevState,
                profileInfo
            }));
        }).catch((reason) => {
            console.error(reason);
        });
    }, []);

    return <div className="card col-8 col-md-4 mt-2 align-middle text-center">
        <div className="card-header">
            <ProfilePicture pfpSmall={state.profileInfo?.pfpSmall || ''} />
        </div>
        <div className="card-body">
            <h5 className="card-title">{state.profileInfo?.displayName || ''}
                {
                    state.profileInfo?.displayNameIndex && state.profileInfo?.displayNameIndex > 0
                    ? <small className="text-muted">#{state.profileInfo?.displayNameIndex}</small>
                    : <></>
                }
            </h5>
        </div>
        {
            props.checkForValidSession()
            ? <div className="card-footer text-right">
                <ConnectionButton uniqueId={state.profileInfo?.uniqueId} />
            </div>
            : <></>
        }
    </div>;
}

function UserPage (props) {
    const { url } = useRouteMatch();

    return <>
        <Route path={`${url}/:profileName`}>
            <User 
                appConstants={props.appConstants}
                checkForValidSession={props.checkForValidSession}
                setTitle={props.setTitle}
            />
        </Route>
        <Route path={`${url}`} exact={true} render={() => {
                return (
                    props.checkForValidSession()
                    ? <Redirect to="/profile" />
                    : <Redirect to="/login" />
                );
            }}
        />
    </>;
}

export default withRouter(UserPage);