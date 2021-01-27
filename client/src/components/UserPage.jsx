import React, { useEffect } from 'react';
import { Redirect, Route, useParams, useRouteMatch, withRouter } from 'react-router-dom';
//import User from './User';

function User (props) {
    const { profileName } = useParams();

    useEffect(() => {
        props.setTitle(profileName);
    }, []);

    return <div>
        {profileName}
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