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
import Welcome from './Welcome'


export default function App() {
    const [title, setTitle] = useState(null);
    const [statusMessage, setStatusMessage] = useState({type: 'info', message: null});
    const [userInfo, setUserInfo] = Hooks.useStateWithLocalStorage('userInfo', null);

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

    // Check if the userInfo is hanging around and if it's expired, if so, delete it
    useEffect(() => {
        checkForValidSession();
    }, []);

    return(
        <div className="App">
            <Router>
                <Header title={title} userInfo={userInfo} setUserInfo={setUserInfo} />
                <div className="container-fluid d-flex align-items-center flex-column">
                    <Switch>
                        <Route path="/" exact={true}>
                            <Welcome setTitle={setTitle} />
                        </Route>
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
                                userInfo={userInfo}
                                setUserInfo={setUserInfo}
                            />
                        </Route>
                        <Route path="/profile" exact={true} render={() => {
                            return (checkForValidSession() ? 
                            <Profile setTitle={setTitle} /> : 
                            <Redirect to="/login" />)
                        }} />
                    </Switch>
                </div>
            </Router>
        </div>
    );
};
