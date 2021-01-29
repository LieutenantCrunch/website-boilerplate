import React, {useState, useEffect} from 'react';
import {BrowserRouter as Router,
    Switch,
    Route,
    Redirect
} from 'react-router-dom';

import * as Hooks from '../hooks/hooks';

import Header from './Header';
import LoginForm from './RegistrationForm/LoginForm';
import Profile from './Profile';
import RegistrationForm from './RegistrationForm/RegistrationForm';
import Welcome from './Welcome';
import SettingsPage from './SettingsPage';
import ResetPassword from './ResetPassword';
import SideMenu from './SideMenu/SideMenu';
import UserPage from './UserPage';

import UserService from '../services/user.service';
import UtilityService from '../services/utility.service';


export default function App() {
    const [title, setTitle] = useState(null);
    const [statusMessage, setStatusMessage] = useState({type: 'info', message: null});
    const [userInfo, setUserInfo] = Hooks.useStateWithLocalStorage('userInfo', null);
    const [appConstants, setAppConstants] = useState({
        DisplayNameChangeDays: 30, 
        ProfileNameRegexDetails: {
            Pattern: '^[\-\._~]*(?:[a-z0-9][\-\._~]*){3,}',
            Flags: 'i'
        },
        ProfileNameRegex: /^[\-\._~]*(?:[a-z0-9][\-\._~]*){3,}/i
    });
    const [userDetails, setUserDetails] = useState({email: '', displayName: '', displayNameIndex: -1, pfp: '', roles: [], uniqueId: ''});
    const [appState, updateAppState] = useState({
        connectionTypeDict: {}
    })

    const checkForValidSession = () => {
        if (!userInfo) {
            return false;
        }
        else if (userInfo.expirationDate && Date.now() > userInfo.expirationDate) {
            setStatusMessage({type: 'warning', message: 'Please re-enter your credentials'});
            setUserInfo(null);
            return false;
        }

        return true;
    };
    
    useEffect(() => {
        // Check if the userInfo is hanging around and if it's expired, if so, delete it
        // Else make sure the userDetails are populated
        if (checkForValidSession()) {
            UserService.getCurrentDetails(setUserDetails);
            fetchConnectionTypeDict();
        }

        UtilityService.getConstants().then(constants => {
            if (constants.ProfileNameRegexDetails) {
                constants.ProfileNameRegex = new RegExp(constants.ProfileNameRegexDetails.Pattern, constants.ProfileNameRegexDetails.Flags);
            }

            setAppConstants({
                ...appConstants,
                ...constants
            });
        }, () => {});
    }, []);

    const fetchConnectionTypeDict = async () => {
        if (Object.keys(appState.connectionTypeDict).length === 0) {
            let connectionTypeDict = await UserService.getConnectionTypeDict();
            
            updateAppState(prevState => ({
                ...prevState,
                connectionTypeDict
            }));

            return connectionTypeDict;
        }
    };

    return(
        <div className="App">
            <Router>
                <Header title={title} userInfo={userInfo} setUserInfo={setUserInfo} userDetails={userDetails} />
                <div className="container-fluid d-flex align-items-center flex-column">
                    <Switch>
                        <Route path="/register" exact={true}>
                            <RegistrationForm 
                                appConstants={appConstants}
                                statusMessage={statusMessage}
                                setTitle={setTitle} 
                                setStatusMessage={setStatusMessage} 
                            />
                        </Route>
                        <Route path="/login" exact={true}>
                            <LoginForm 
                                appConstants={appConstants}
                                statusMessage={statusMessage} 
                                setTitle={setTitle} 
                                setStatusMessage={setStatusMessage}
                                userInfo={userInfo}
                                setUserInfo={setUserInfo}
                            />
                        </Route>
                        <Route path="/reset-password" exact={true}>
                            <ResetPassword 
                                appConstants={appConstants}
                                statusMessage={statusMessage} 
                                setStatusMessage={setStatusMessage}
                                setTitle={setTitle}
                                setUserInfo={setUserInfo} />
                        </Route>
                        <Route path="/profile" exact={true} render={() => {
                            return (checkForValidSession() ? 
                            <Profile 
                                appConstants={appConstants}
                                setTitle={setTitle}
                                userDetails={userDetails}
                                setUserDetails={setUserDetails}
                            /> : 
                            <Redirect to="/login" />)
                        }} />
                        <Route path="/settings" exact={true} render={() => {
                            return (checkForValidSession() ? 
                            <SettingsPage 
                                appConstants={appConstants}
                                setStatusMessage={setStatusMessage}
                                setTitle={setTitle}
                                setUserInfo={setUserInfo}
                                userDetails={userDetails}
                                setUserDetails={setUserDetails}
                            /> : 
                            <Redirect to="/login" />)
                        }} />
                        <Route path="/u">
                            <UserPage 
                                appConstants={appConstants}
                                checkForValidSession={checkForValidSession}
                                setTitle={setTitle}
                            />
                        </Route>
                        <Route path="/" exact={true}>
                            <Welcome setTitle={setTitle} />
                        </Route>
                    </Switch>
                </div>
            </Router>
            {
                checkForValidSession()
                ? <SideMenu userDetails={userDetails} fetchConnectionTypeDict={fetchConnectionTypeDict} appState={appState} />
                : <></>
            }
        </div>
    );
};
