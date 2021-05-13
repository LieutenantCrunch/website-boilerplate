import React, { useEffect, useRef, useState } from 'react';
import { Redirect, Route, useParams, useRouteMatch, withRouter } from 'react-router-dom';
import classNames from 'classnames';

import ProfilePicture from './ProfilePicture';
import UserService from '../services/user.service';
import ConnectionButton from './FormControls/ConnectionButton';

import { useDispatch, useSelector } from 'react-redux';
import { upsertUser } from '../redux/users/usersSlice';
import { selectLoggedIn } from '../redux/rootReducer';

function User (props) {
    const dispatch = useDispatch();
    const { profileName } = useParams();
    const [state, updateState] = useState({
        profileInfo: null
    });
    const loggedIn = useSelector(selectLoggedIn);

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

        return () => {
            if (UserService.getProfileInfoCancel) {
                UserService.getProfileInfoCancel();
            }
        };
    }, []);

    return <div className="card col-12 col-sm-10 col-md-8 col-lg-6 col-xxl-4 mt-2 align-middle text-center">
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
            loggedIn
            ? <div className="card-footer text-end">
                <ConnectionButton uniqueId={state.profileInfo?.uniqueId} />
            </div>
            : <></>
        }
    </div>;
}

function UserPage (props) {
    const { url } = useRouteMatch();
    const loggedIn = useSelector(selectLoggedIn);

    return <>
        <Route path={`${url}/:profileName`}>
            <User 
                setTitle={props.setTitle}
            />
        </Route>
        <Route path={`${url}`} exact={true} render={() => {
                return (
                    loggedIn
                    ? <Redirect to="/profile" />
                    : <Redirect to="/login" />
                );
            }}
        />
    </>;
}

export default withRouter(UserPage);