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
import { connectionTypesFetched } from '../redux/connections/connectionTypesSlice';
import { currentUserFetched } from '../redux/users/currentUserSlice';

export default function App() {
    const dispatch = useDispatch();
    const [title, setTitle] = useState(null);
    const [statusMessage, setStatusMessage] = useState({type: 'info', message: null});
    const [loginDetails, setLoginDetails] = Hooks.useStateWithLocalStorage('loginDetails', null);

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
        // Check if the loginDetails is hanging around and if it's expired, if so, delete it
        // Else make sure the userDetails are populated
        if (checkForValidSession()) {
            UserService.getCurrentDetails().then(details => {
                if (details) {
                    dispatch(currentUserFetched(details));
                }
            });

            UserService.getConnectionTypeDict().then(connectionTypeDict => {
                if (connectionTypeDict) {
                    dispatch(connectionTypesFetched(connectionTypeDict));
                }
            });
        }

        return () => {
            if (UserService.getCurrentDetailsCancel) {
                UserService.getCurrentDetailsCancel();
            }

            if (UserService.getConnectionTypeDictCancel) {
                UserService.getConnectionTypeDictCancel();
            }
        }
    }, [loginDetails]);

    return(
        <div className="App">
            <Router>
                <Header title={title} loginDetails={loginDetails} setLoginDetails={setLoginDetails} />
                <div className="container-fluid d-flex align-items-center flex-column">
                    <Switch>
                        <Route path="/register" exact={true}>
                            <RegistrationForm 
                                statusMessage={statusMessage}
                                setTitle={setTitle} 
                                setStatusMessage={setStatusMessage} 
                            />
                        </Route>
                        <Route path="/login" exact={true}>
                            <LoginForm 
                                statusMessage={statusMessage} 
                                setTitle={setTitle} 
                                setStatusMessage={setStatusMessage}
                                loginDetails={loginDetails}
                                setLoginDetails={setLoginDetails}
                            />
                        </Route>
                        <Route path="/reset-password" exact={true}>
                            <ResetPassword 
                                statusMessage={statusMessage} 
                                setStatusMessage={setStatusMessage}
                                setTitle={setTitle}
                                setLoginDetails={setLoginDetails} />
                        </Route>
                        <Route path="/feed" exact={true}>
                            <Feed 
                                setTitle={setTitle} />
                        </Route>
                        <Route path="/profile" exact={true} render={() => {
                            return (checkForValidSession() ? 
                            <Profile 
                                setTitle={setTitle}
                            /> : 
                            <Redirect to="/login" />)
                        }} />
                        <Route path="/settings" exact={true} render={() => {
                            return (checkForValidSession() ? 
                            <SettingsPage 
                                setStatusMessage={setStatusMessage}
                                setTitle={setTitle}
                                setLoginDetails={setLoginDetails}
                            /> : 
                            <Redirect to="/login" />)
                        }} />
                        <Route path="/u">
                            <UserPage 
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
                ? <SideMenu />
                : <></>
            }
        </div>
    );
};
