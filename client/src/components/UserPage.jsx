import React, { useEffect, useRef, useState } from 'react';
import { Redirect, Route, useParams, useRouteMatch, withRouter } from 'react-router-dom';
import classNames from 'classnames';

import ProfilePicture from './ProfilePicture';
import UserService from '../services/user.service';
import ConnectionButton from './FormControls/ConnectionButton';

function User (props) {
    const { profileName } = useParams();
    const [state, updateState] = useState({
        profileInfo: {},
        connection: null
    });

    const updateConnection = (connection) => {
        updateState(prevState => ({
            ...prevState,
            connection: {
                id: connection.id,
                details: {
                    ...prevState.connection?.details,
                    ...connection.details
                }
            }
        }));
    }

    useEffect(() => {
        UserService.getProfileInfo(profileName).then((profileInfo) => {
            let title = profileInfo.displayName;
            if (profileInfo.displayNameIndex > 0) {
                title += `#${profileInfo.displayNameIndex}`;
            }

            props.setTitle(`${title}'s Profile`);

            updateState(prevState => ({
                ...prevState,
                profileInfo,
                connection: {
                    id: profileInfo.uniqueId,
                    details: {
                        ...profileInfo
                    }
                }
            }));
        }).catch((reason) => {
            console.error(reason);
        });
    }, []);

    return <div className="card col-8 col-md-4 mt-2 align-middle text-center">
        <div className="card-header">
            <ProfilePicture pfpSmall={state.profileInfo.pfpSmall || ''} />
        </div>
        <div className="card-body">
            <h5 className="card-title">{state.profileInfo.displayName || ''}
                {
                    state.profileInfo.displayNameIndex && state.profileInfo.displayNameIndex > 0
                    ? <small className="text-muted">#{state.profileInfo.displayNameIndex}</small>
                    : <></>
                }
            </h5>
        </div>
        {
            props.checkForValidSession()
            ? <div className="card-footer text-right">
                <ConnectionButton connection={state.connection} updateConnection={updateConnection} />
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