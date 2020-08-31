// https://medium.com/technoetics/create-basic-login-forms-using-react-js-hooks-and-bootstrap-2ae36c15e551
import React, {useState, useEffect} from 'react';
import { withRouter } from 'react-router-dom';
import classNames from 'classnames';
import {isMobile} from 'react-device-detect';

import * as Hooks from '../../hooks/hooks';
import AuthService from '../../services/auth.service';
import YesNoMessageBox from '../MessageBoxes/YesNoMessageBox';

function LoginForm (props) {
    const [state, setState] = useState({password: ''});
    const [sessionState, setSessionState] = Hooks.useStateWithSessionStorage('state', {email: '', requestedPasswordReset: false});
    const [yesNoMessageBoxProps, setYesNoMessageBoxProps] = useState({caption: null, message: null, subtext: null, yesCallback: () => {}, noCallback: () => {}});
    const [requestedPasswordReset, setRequestedPasswordReset] = useState(false);
    const setStatusMessage = props.setStatusMessage;
    const hasStatusMessage = (props.statusMessage && props.statusMessage.message) || false;
    const statusMessageType = (hasStatusMessage ? props.statusMessage.type : 'transparent');
    const yesNoMessageBoxId = 'LoginFormYesNoMessageBox';
    let yesNoMessageBox = null;

    useEffect(() => {
        props.setTitle('Login');
    }, []);

    const getYesNoMessageBox = () => {
        if (!yesNoMessageBox) {
            yesNoMessageBox = new bootstrap.Modal(document.getElementById(yesNoMessageBoxId), {show: false});
        }

        return yesNoMessageBox;
    };

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
            setSessionState(prevSessionState => ({
                ...prevSessionState,
                requestedPasswordReset : false
            }));

            props.setUserInfo(results.userInfo);
            redirectToProfile();
        }
        else {
            setStatusMessage(results.statusMessage);
        }
    };

    const redirectToProfile = () => {
        props.history.push('/profile');
    };

    const redirectToRegistration = () => {
        props.history.push('/register')
    };

    const requestPasswordResetStep1 = () => {
        if (sessionState.requestedPasswordReset) {
            setYesNoMessageBoxProps({caption: 'Confirm Reset', 
                message: 'You have already requested a password reset, are you sure you want to request another?', 
                subtext: 'If you aren\'t receiving an email, please contact support.', 
                yesCallback: requestPasswordResetStep2, 
                noCallback: () => {}}
            );
            getYesNoMessageBox().show();
        }
        else {
            requestPasswordResetStep2();
        }
    };

    const requestPasswordResetStep2 = async () => {
        if (!sessionState.email.length) {
            setStatusMessage({type: 'info', message: 'Please enter your email address'});
        }
        else {
            setSessionState(prevSessionState => ({
                ...prevSessionState,
                requestedPasswordReset : true
            }));

            let results = await AuthService.requestPasswordReset(sessionState.email);

            setStatusMessage(results.statusMessage);
        }
    };

    return (
        <>
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
                            <small id="emailHelp" className="form-text ml-2 text-muted">Your email will not be shared with anyone else.</small>
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
                            <small className="form-text ml-2 text-muted">Forgot your password? <button className="align-baseline btn btn-sm btn-link" onClick={requestPasswordResetStep1} type="button">{isMobile ? 'Tap' : 'Click'} Here</button></small>
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
                    <span>Don't have an account?</span><br />
                    <span className="btn btn-link" onClick={redirectToRegistration}>Register</span>
                </div>
            </div>
            <YesNoMessageBox id={yesNoMessageBoxId} 
                caption={yesNoMessageBoxProps.caption} 
                message={yesNoMessageBoxProps.message} 
                subtext={yesNoMessageBoxProps.subtext} 
                yesCallback={yesNoMessageBoxProps.yesCallback}
                noCallback={yesNoMessageBoxProps.noCallback}
            />
        </>
    );
};

// Wrap in withRouter so it can get access to props.history
export default withRouter(LoginForm);