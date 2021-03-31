// React
import React, {useState, useEffect} from 'react';
import {BrowserRouter as Router,
    Switch,
    Route,
    Redirect
} from 'react-router-dom';

// Hooks
import * as Hooks from '../hooks/hooks';

// Components
import Feed from './Feed';
import Header from './Header';
import LoginForm from './RegistrationForm/LoginForm';
import Profile from './Profile';
import RegistrationForm from './RegistrationForm/RegistrationForm';
import ResetPassword from './ResetPassword';
import SettingsPage from './SettingsPage';
import SideMenu from './SideMenu/SideMenu';
import UserPage from './UserPage';
import Welcome from './Welcome';

// Services
import UserService from '../services/user.service';
import UtilityService from '../services/utility.service';

// Redux
import { useSelector, useDispatch } from 'react-redux';
import { currentUserFetched } from '../redux/users/currentUserSlice';


export default function App() {
    const dispatch = useDispatch();
    const [title, setTitle] = useState(null);
    const [statusMessage, setStatusMessage] = useState({type: 'info', message: null});
    const [loginDetails, setLoginDetails] = Hooks.useStateWithLocalStorage('loginDetails', null);
    const [appConstants, setAppConstants] = useState({
        DisplayNameChangeDays: 30, 
        ProfileNameRegexDetails: {
            Pattern: '^[\-\._~]*(?:[a-z0-9][\-\._~]*){3,}',
            Flags: 'i'
        },
        ProfileNameRegex: /^[\-\._~]*(?:[a-z0-9][\-\._~]*){3,}/i
    });
    const [userDetails, setUserDetails] = useState({
        allowPublicAccess: false,
        displayName: '', 
        displayNameIndex: -1, 
        email: '', 
        pfp: '', 
        roles: [], 
        uniqueId: ''
    });

    const [appState, updateAppState] = useState({
        connectionTypeDict: {}
    })

    const checkForValidSession = () => {
        if (!loginDetails) {
            return false;
        }
        else if (loginDetails.expirationDate && Date.now() > loginDetails.expirationDate) {
            setStatusMessage({type: 'warning', message: 'Please re-enter your credentials'});
            setLoginDetails(null);
            return false;
        }

        return true;
    };

    useEffect(() => {
        // Probably want to implement cancels for these async calls in the cleanup function

        // Check if the loginDetails is hanging around and if it's expired, if so, delete it
        // Else make sure the userDetails are populated
        if (checkForValidSession()) {
            UserService.getCurrentDetails().then(details => {
                if (details) {
                    setUserDetails(details);
                }

                dispatch(currentUserFetched(details));
            });
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
                <Header title={title} loginDetails={loginDetails} setLoginDetails={setLoginDetails} userDetails={userDetails} />
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
                                loginDetails={loginDetails}
                                setLoginDetails={setLoginDetails}
                            />
                        </Route>
                        <Route path="/reset-password" exact={true}>
                            <ResetPassword 
                                appConstants={appConstants}
                                statusMessage={statusMessage} 
                                setStatusMessage={setStatusMessage}
                                setTitle={setTitle}
                                setLoginDetails={setLoginDetails} />
                        </Route>
                        <Route path="/feed" exact={true}>
                            <Feed 
                                appConstants={appConstants}
                                setTitle={setTitle}
                                setUserDetails={setUserDetails} />
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
                                setLoginDetails={setLoginDetails}
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
