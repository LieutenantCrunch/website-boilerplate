import React, {useState} from 'react';
import {BrowserRouter as Router,
    Switch,
    Route
} from 'react-router-dom';

import Header from './Header';
import LoginForm from './RegistrationForm/LoginForm';
import Profile from './Profile';
import RegistrationForm from './RegistrationForm/RegistrationForm';


export default function App() {
    const [title, updateTitle] = useState(null);

    return(
        <div className="App">
            <Router>
                <Header title={title} />
                <div className="container-fluid d-flex align-items-center flex-column">
                    <Switch>
                        <Route path="/" exact={true}>
                            <LoginForm updateTitle={updateTitle} />
                        </Route>
                        <Route path="/register" exact={true}>
                            <RegistrationForm updateTitle={updateTitle} />
                        </Route>
                        <Route path="/login">
                            <LoginForm updateTitle={updateTitle} />
                        </Route>
                        <Route path="/profile">
                            <Profile updateTitle={updateTitle} />
                        </Route>
                    </Switch>
                </div>
            </Router>
        </div>
    );
};
