// https://medium.com/technoetics/create-basic-login-forms-using-react-js-hooks-and-bootstrap-2ae36c15e551
import React, { useContext, useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import classNames from 'classnames';
import {isMobile} from 'react-device-detect';

import * as Hooks from '../../hooks/hooks';
import AuthService from '../../services/auth.service';
import { MESSAGE_BOX_TYPES } from '../Dialogs/MessageBox';

// Contexts
import { MessageBoxUpdaterContext } from '../../contexts/withMessageBox';

// Material UI
import FormControl from '@material-ui/core/FormControl';
import IconButton from '@material-ui/core/IconButton';
import InputLabel from '@material-ui/core/InputLabel';
import InputAdornment from '@material-ui/core/InputAdornment';
import FilledInput from '@material-ui/core/FilledInput';
import MaterialTextField from '@material-ui/core/TextField';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';

export const LoginForm = ({ setLoginDetails, setStatusMessage, setTitle, statusMessage }) => {
    const history = useHistory();

    const [state, setState] = useState({
        password: '',
        showPassword: false
    });
    const [sessionState, setSessionState] = Hooks.useStateWithSessionStorage('state', {
        email: '', 
        requestedPasswordReset: false
    });
    const hasStatusMessage = (statusMessage && statusMessage.message) || false;
    const statusMessageType = (hasStatusMessage ? statusMessage.type : 'transparent');
    const setMessageBoxOptions = useContext(MessageBoxUpdaterContext);

    useEffect(() => {
        setTitle('Login');
    }, []);

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

        e.preventDefault();
    };

    const handleShowPassword = (e) => {
        setState(prevState => ({
           ...prevState,
           showPassword: !prevState.showPassword 
        }));
    };
    
    const handleShowPasswordMouseDown = (e) => {
        e.preventDefault();
    };

    const sendCredentialsToServer = async () => {
        let { loginDetails, startPage, statusMessage, success } = await AuthService.login(sessionState.email, state.password);

        if (success) {
            setStatusMessage({type: 'info', message: null});
            setSessionState(prevSessionState => ({
                ...prevSessionState,
                requestedPasswordReset : false
            }));

            setLoginDetails(loginDetails);

            // Redirect to their startPage if they have one set, otherwise redirect to their profile
            history.push(`/${startPage || 'profile'}`);
        }
        else {
            setStatusMessage(statusMessage);
        }
    };

    const redirectToRegistration = () => {
        history.push('/register')
    };

    const requestPasswordResetStep1 = () => {
        if (sessionState.requestedPasswordReset) {
            setMessageBoxOptions({
                isOpen: true,
                messageBoxProps: {
                    actions: MESSAGE_BOX_TYPES.YES_NO,
                    caption: 'Confirm Password Reset',
                    message: 'You have already requested a password reset, are you sure you want to request another?',
                    onConfirm: requestPasswordResetStep2,
                    onDeny: () => {},
                    onCancel: undefined,
                    subtext: 'If you aren\'t receiving an email, please contact support.'
                }
            });
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
            <div className="card col-12 col-sm-10 col-md-8 col-lg-6 col-xxl-4 mt-2 align-middle text-center">
                <div className={classNames('card-header', {
                    'd-none': !hasStatusMessage,
                    [`bg-${statusMessageType}`]: true,
                    'text-light': statusMessageType !== 'warning',
                    'text-dark': statusMessageType === 'warning'
                })}>
                    {hasStatusMessage ? statusMessage.message : ''}
                </div>
                <div className="card-body">
                    <form>
                        <div className="mb-3 text-start">
                            <MaterialTextField id="email"
                                type="email"
                                label="Email"
                                onChange={handleSessionStateChange}
                                required
                                size="small"
                                style={{ width: '100%' }}
                                value={sessionState.email}
                                variant="filled" 
                            />
                            <small id="emailHelp" className="form-text ml-2 text-muted">Your email will not be shared with anyone else.</small>
                        </div>
                        <div className="mb-3 text-start">
                            <FormControl required variant="filled" size="small" style={{ width: '100%' }}>
                                <InputLabel htmlFor="password">Password</InputLabel>
                                <FilledInput
                                    id="password"
                                    type={state.showPassword ? 'text' : 'password'}
                                    required
                                    value={state.password}
                                    variant="filled" 
                                    onChange={handleStateChange}
                                    endAdornment={
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={handleShowPassword}
                                                onMouseDown={handleShowPasswordMouseDown}
                                                edge="end"
                                            >
                                                {
                                                    state.showPassword 
                                                    ? <Visibility /> 
                                                    : <VisibilityOff />
                                                }
                                            </IconButton>
                                        </InputAdornment>
                                    }
                                />
                            </FormControl>
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
        </>
    );
};
