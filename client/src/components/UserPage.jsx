import React, { useEffect, useState } from 'react';
import { Redirect, Route, useParams, useRouteMatch, withRouter } from 'react-router-dom';
import ProfilePicture from './ProfilePicture';
import UserService from '../services/user.service';

function User (props) {
    const { profileName } = useParams();
    const [profileInfo, setProfileInfo] = useState({});

    useEffect(() => {
        UserService.getProfileInfo(profileName).then((profileInfo) => {
            let title = profileInfo.displayName;
            if (profileInfo.displayNameIndex > 0) {
                title += `#${profileInfo.displayNameIndex}`;
            }

            props.setTitle(`${title}'s Profile`);

            setProfileInfo(profileInfo);
        }).catch((reason) => {
            console.error(reason);
        });
    }, []);

    return <div className="card col-8 col-md-4 mt-2 align-middle text-center">
        <div className="card-header">
            <ProfilePicture pfpSmall={profileInfo.pfpSmall || ''} />
        </div>
        <div className="card-body">
            <h5 className="card-title">{profileInfo.displayName || ''}
                {
                    profileInfo.displayNameIndex && profileInfo.displayNameIndex > 0
                    ? <small className="text-muted">#{profileInfo.displayNameIndex}</small>
                    : <></>
                }
            </h5>
        </div>
    </div>;
}

function UserPage (props) {
    const { url } = useRouteMatch();

    return <>
        <Route path={`${url}/:profileName`}>
            <User 
                appConstants={props.appConstants}
                setTitle={props.setTitle}
            />
        </Route>
        <Route path={`${url}`} exact={true}>
            <Redirect to="/profile" />
        </Route>
    </>;
}

export default withRouter(UserPage);