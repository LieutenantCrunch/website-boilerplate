import React, {useState, useEffect} from 'react';
import {BrowserRouter as Router,
    Switch,
    Route
} from 'react-router-dom';

import * as Hooks from '../hooks/hooks';

import Header from './Header';
import LoginForm from './RegistrationForm/LoginForm';
import Profile from './Profile';
import RegistrationForm from './RegistrationForm/RegistrationForm';
import Welcome from './Welcome'
import AuthService from '../services/auth.service';


export default function App() {
    const [title, setTitle] = useState(null);
    const [statusMessage, setStatusMessage] = useState({type: 'info', message: null});
    const [userInfo, setUserInfo] = Hooks.useStateWithLocalStorage('userInfo', null);

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
                        <Route path="/profile" exact={true}>
                            <Profile setTitle={setTitle} />
                        </Route>
                    </Switch>
                </div>
            </Router>
        </div>
    );
};
