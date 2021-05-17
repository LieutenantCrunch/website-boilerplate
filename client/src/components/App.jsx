// React
import React, { useContext, useEffect, useState} from 'react';
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
import ViewPost from './ViewPost';
import Welcome from './Welcome';

// Services
import UserService from '../services/user.service';

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { connectionTypesFetched } from '../redux/connections/connectionTypesSlice';
import { currentUserFetched } from '../redux/users/currentUserSlice';

// Socket.IO
import { SocketContext } from '../contexts/socket';

import { LoggedInContext } from '../contexts/loggedIn';

export default function App() {
    const dispatch = useDispatch();
    const [title, setTitle] = useState(null);
    const [statusMessage, setStatusMessage] = useState({type: 'info', message: null});
    const [loginDetails, setLoginDetails] = Hooks.useStateWithLocalStorage('loginDetails', null);
    const [headerMiddleEl, setHeaderMiddleEl] = useState(<div></div>);

    const socket = useContext(SocketContext);

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

            socket.connect();
        }

        return () => {
            if (UserService.getCurrentDetailsCancel) {
                UserService.getCurrentDetailsCancel();
            }

            if (UserService.getConnectionTypeDictCancel) {
                UserService.getConnectionTypeDictCancel();
            }

            socket.disconnect();
        }
    }, [loginDetails]);

    return(
        <div className="App">
            <LoggedInContext.Provider value={checkForValidSession()}>
                <Router>
                    <Header title={title} loginDetails={loginDetails} setLoginDetails={setLoginDetails} headerMiddleEl={headerMiddleEl} />
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
                                    setTitle={setTitle}
                                    setHeaderMiddleEl={setHeaderMiddleEl}
                                />
                            </Route>
                            <Route path="/view-post" exact={true}>
                                <ViewPost 
                                    setTitle={setTitle}
                                />
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
            </LoggedInContext.Provider>
        </div>
    );
};
