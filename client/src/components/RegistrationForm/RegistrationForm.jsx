// https://medium.com/technoetics/create-basic-login-forms-using-react-js-hooks-and-bootstrap-2ae36c15e551
import React, {useState} from 'react';
import { withRouter } from 'react-router-dom';
import classNames from 'classnames';

import * as Hooks from '../../hooks/hooks';
import AuthService from '../../services/auth.service';

function RegistrationForm(props) {
    const [state, setState] = useState({password: '', confirmPassword: ''});
    const [sessionState, setSessionState] = Hooks.useStateWithSessionStorage('state', {email: '', displayName: ''});
    const setStatusMessage = props.setStatusMessage;

    const handleSessionStateChange = (e) => {
        /* Use destructuring to populate an object with id/value from the event target ({id = event.target.id, value = event.target.value}) */
        const {id, value} = e.target;

        /* Use an arrow function that returns an object literal populated with the prevSessionState (using the spread operator) and with the value set on the computed key using the target's id, pass that into setSessionState */
        setSessionState(prevSessionState => ({
            ...prevSessionState,
            [id] : value
        }));
    };

    const handleStateChange = (e) => {
        /* Use destructuring to populate an object with id/value from the event target ({id = event.target.id, value = event.target.value}) */
        const {id, value} = e.target;

        /* Use an arrow function that returns an object literal populated with the prevState (using the spread operator) and with the value set on the computed key using the target's id, pass that into setState */
        setState(prevState => ({
            ...prevState,
            [id] : value
        }));
    };

    const handleSubmitClick = (e) => {
        e.preventDefault();
        // This needs to be converted to leverage some better type of Form validation, whether HTML 5 or something else
        if (!sessionState.email.length) {
            setStatusMessage({type: 'danger', message: 'You must enter an email'});
        }
        if (!sessionState.displayname.length) {
            setStatusMessage({type: 'danger', message: 'You must enter a display name. Note that it does not have to be unique.'});
        }
        else if (state.password === state.confirmPassword) {
            if (!state.password.length) {
                setStatusMessage({type: 'danger', message: 'You must enter a password'});
            }
            else {
                sendRegistrationToServer();
            }
        }
        else {
            setStatusMessage({type: 'danger', message: 'Passwords do not match'});
        }
    };

    const sendRegistrationToServer = async () => {
        const payload = {
            email: sessionState.email,
            displayName: sessionState.displayName,
            password: state.password,
            confirmPassword: state.confirmPassword
        };

        let results = await AuthService.register(payload);

        setStatusMessage(results.statusMessage);
        if (results.success) {
            redirectToLogin();
        }
    };

    const redirectToLogin = () => {
        props.setTitle('Login');
        props.history.push('/login')
    };

    const statusMessageType = props.statusMessage.type;

    return (
        /* https://getbootstrap.com/docs/4.0/components/forms/#form-groups
            text-muted: https://www.w3schools.com/Bootstrap/bootstrap_ref_css_helpers.asp
            card-body adds the padding
         */
        <div className="card col-8 col-md-4 mt-2 align-middle text-center">
            <div className={classNames('card-header', {
                'd-none': !props.statusMessage.message,
                [`bg-${statusMessageType}`]: true,
                'text-light': statusMessageType !== 'warning',
                'text-dark': statusMessageType === 'warning'
            })}>
                {props.statusMessage.message}
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
                        <label htmlFor="displayName">Display Name</label>
                        <input id="displayName"
                            type="text"
                            required
                            className="form-control"
                            placeholder="Enter display name"
                            aria-describedby="displayNameHelp"
                            value={sessiostanState.displayName}
                            onChange={handleSessionStateChange}
                        />
                        <small id="displayNameHelp" className="form-text text-muted">This is the name other users will see.</small>
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
                    <div className="mb-3 text-left">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input id="confirmPassword"
                            type="password"
                            required
                            className="form-control"
                            placeholder="Confirm Password"
                            value={state.confirmPassword}
                            onChange={handleStateChange}
                        />
                    </div>
                    <button type="submit"
                        className="btn btn-primary"
                        onClick={handleSubmitClick}
                    >
                        Register
                    </button>
                </form>
            </div>
            <div className="card-footer text-muted">
                <span>Already have an account? </span><br />
                <span className="btn btn-link" onClick={redirectToLogin}>Log In</span>
            </div>
        </div>
    );
};

// Wrap in withRouter so it can get access to props.history
export default withRouter(RegistrationForm);