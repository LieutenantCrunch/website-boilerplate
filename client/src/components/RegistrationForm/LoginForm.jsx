// https://medium.com/technoetics/create-basic-login-forms-using-react-js-hooks-and-bootstrap-2ae36c15e551
import React, {useState} from 'react';
import { withRouter } from 'react-router-dom';
import classNames from 'classnames';

import * as Hooks from '../../hooks/hooks';
import AuthService from '../../services/auth.service';

function LoginForm (props) {
    const [state, setState] = useState({password: ''});
    const [sessionState, setSessionState] = Hooks.useStateWithSessionStorage('state', {email: ''});
    const setStatusMessage = props.setStatusMessage;

    const handleSessionStateChange = (e) => {
        /* Use destructuring to populate an object with id/value from the event target ({id = event.target.id, value = event.target.value}) */
        const {id, value} = e.target;
        

        /* Use an arrow function that returns an object literal populated with the prevSessionState (using the spread operator) and with the value set on the property specified by the target's id, pass that into setSessionState */
        setSessionState(prevSessionState => ({
            ...prevSessionState,
            [id] : value
        }));
    }

    const handleStateChange = (e) => {
        /* Use destructuring to populate an object with id/value from the event target ({id = event.target.id, value = event.target.value}) */
        const {id, value} = e.target;
        

        /* Use an arrow function that returns an object literal populated with the prevState (using the spread operator) and with the value set on the property specified by the target's id, pass that into setState */
        setState(prevState => ({
            ...prevState,
            [id] : value
        }));
    }

    const handleSubmitClick = (e) => {
        e.preventDefault();
        // This needs to be converted to leverage some better type of Form validation, whether HTML 5 or something else
        if (!sessionState.email.length) {
            setStatusMessage({type: 'danger', message: 'You must enter an email'});
        }
        else if (!state.password.length) {
            setStatusMessage({type: 'danger', message: 'You must enter a password'});
        }
        else {
            sendCredentialsToServer();
        }
    };

    const sendCredentialsToServer = async () => {
        let results = await AuthService.login(sessionState.email, state.password);

        if (results.success) {
            setStatusMessage(null);
            props.setUserInfo(results.userInfo);
            redirectToProfile();
        }
        else {
            setStatusMessage(results.statusMessage);
        }
    };

    const redirectToProfile = () => {
        props.setTitle('My Profile');
        props.history.push('/profile');
    };

    const redirectToRegistration = () => {
        props.setTitle('Register');
        props.history.push('/register')
    };

    const hasStatusMessage = (props.statusMessage && props.statusMessage.message) || false;
    const statusMessageType = (hasStatusMessage ? props.statusMessage.type : 'transparent');

    return (
        <div className="card col-8 col-md-4 mt-2 align-middle text-center">
            <div className={classNames('card-header', {
                'd-none': !hasStatusMessage,
                [`bg-${statusMessageType}`]: true,
                'text-light': statusMessageType !== 'warning',
                'text-dark': statusMessageType === 'warning'
            })}>
                {hasStatusMessage ? props.statusMessage.message : ''}
            </div>
            <div className="card-body">
                <form>
                    <div className="mb-3 text-left">
                        <label htmlFor="email">Email Address</label>
                        <input id="email"
                            type="email"
                            required
                            className="form-control"
                            placeholder="Enter email"
                            aria-describedby="emailHelp"
                            value={sessionState.email}
                            onChange={handleSessionStateChange}
                        />
                        <small id="emailHelp" className="form-text text-muted">Your email will not be shared with anyone else.</small>
                    </div>
                    <div className="mb-3 text-left">
                        <label htmlFor="password">Password</label>
                        <input id="password"
                            type="password"
                            required
                            className="form-control"
                            placeholder="Password"
                            value={state.password}
                            onChange={handleStateChange}
                        />
                    </div>
                    <button type="submit"
                        className="btn btn-primary"
                        onClick={handleSubmitClick}
                    >
                        Login
                    </button>
                </form>
            </div>
            <div className="card-footer text-muted">
                <span>Don't have an account? </span><br />
                <span className="btn btn-link" onClick={redirectToRegistration}>Register</span>
            </div>
        </div>
    );
};

// Wrap in withRouter so it can get access to props.history
export default withRouter(LoginForm);