import React, {useEffect, useState, useRef} from 'react';
import {withRouter} from 'react-router-dom';
import AuthService from '../services/auth.service';
import classNames from 'classnames';

function ResetPassword(props) {
    const [state, setState] = useState({email: '', password: '', confirmPassword: ''});
    const setStatusMessage = props.setStatusMessage;

    useEffect(() => {
        props.setTitle('Reset Password');
    }, []);

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
        if (!state.email.length) {
            setStatusMessage({type: 'danger', message: 'You must enter an email'});
        }
        else if (state.password === state.confirmPassword) {
            if (!state.password.length) {
                setStatusMessage({type: 'danger', message: 'You must enter a password'});
            }
            else {
                resetPassword();
            }
        }
        else {
            setStatusMessage({type: 'danger', message: 'Passwords do not match'});
        }
    };

    const resetPassword = async () => {
        let searchParams = new URLSearchParams(props.location.search);
        let token = searchParams.get('token');
        let results = await AuthService.resetPassword(token, state.email, state.password, state.confirmPassword);

        setStatusMessage(results.statusMessage);
        if (results.success) {
            props.setUserInfo(null);
            redirectToLogin();
        }
    };

    const redirectToLogin = () => {
        props.setTitle('Login');
        props.history.push('/login')
    };

    const statusMessageType = props.statusMessage.type;

    return (
        <>
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
                                value={state.email}
                                onChange={handleStateChange}
                                aria-describedby="emailHelp"
                            />
                            <small id="emailHelp" className="form-text text-muted">Please confirm your email</small>
                        </div>
                        <div className="mb-3 text-left">
                            <label htmlFor="password">New Password</label>
                            <input id="password"
                                type="password"
                                required
                                className="form-control"
                                placeholder="New Password"
                                value={state.password}
                                onChange={handleStateChange}
                            />
                        </div>
                        <div className="mb-3 text-left">
                            <label htmlFor="confirmPassword">Confirm New Password</label>
                            <input id="confirmPassword"
                                type="password"
                                required
                                className="form-control"
                                placeholder="Confirm New Password"
                                value={state.confirmPassword}
                                onChange={handleStateChange}
                            />
                        </div>
                        <button type="submit"
                            className="btn btn-primary"
                            onClick={handleSubmitClick}
                        >
                            Change Password
                        </button>
                    </form>
                </div>
                <div className="card-footer text-muted">
                    <span>Remembered your password? </span><br />
                    <span className="btn btn-link" onClick={redirectToLogin}>Log In</span>
                </div>
            </div>
        </>
    );
};

export default withRouter(ResetPassword);