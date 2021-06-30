// https://medium.com/technoetics/create-basic-login-forms-using-react-js-hooks-and-bootstrap-2ae36c15e551
import React, {useState} from 'react';
import { useHistory } from 'react-router-dom';
import classNames from 'classnames';
import zxcvbn from 'zxcvbn';

import * as Constants from '../../constants/constants';
import * as Hooks from '../../hooks/hooks';
import AuthService from '../../services/auth.service';

import { HtmlTooltip } from '../HtmlTooltip';

export const RegistrationForm = ({ setStatusMessage, setTitle, statusMessage }) => {
    const history = useHistory();

    const [state, setState] = useState({password: '', confirmPassword: ''});
    const [sessionState, setSessionState] = Hooks.useStateWithSessionStorage('state', {
        displayName: '',
        email: '', 
        firstName: '',
        lastName: '',
        profileName: ''
    });

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
        else if (!sessionState.displayName.length || sessionState.displayName.indexOf('#') > -1) {
            setStatusMessage({type: 'danger', message: 'You must enter a display name and it must not contain #. Note that it does not have to be unique.'});
        }
        else if (!sessionState.profileName.length || !Constants.PROFILE_NAME_REGEX.test(sessionState.profileName)) {
            setStatusMessage({type: 'danger', message: 'You must enter a profile name, it must contain at least three alphanumeric characters, and may only contain the following symbols: - | . | _ | ~.'});
        }
        else if (state.password === state.confirmPassword) {
            if (!state.password.length) {
                setStatusMessage({type: 'danger', message: 'You must enter a password'});
            }
            else {
                if (zxcvbn(state.password).score < 3) {
                    setStatusMessage({type: 'danger', message: 'Your password isn\'t strong enough'})
                }
                else {
                    sendRegistrationToServer();
                }
            }
        }
        else {
            setStatusMessage({type: 'danger', message: 'Passwords do not match'});
        }
    };

    const sendRegistrationToServer = async () => {
        const payload = {
            confirmPassword: state.confirmPassword,
            displayName: sessionState.displayName,
            email: sessionState.email,
            firstName: state.firstName,
            lastName: state.lastName,
            password: state.password
        };

        let results = await AuthService.register(payload);

        setStatusMessage(results.statusMessage);

        if (results.success) {
            setSessionState(prevSessionState => ({
                ...prevSessionState,
                displayName: ''
            }));

            redirectToLogin();
        }
    };

    const redirectToLogin = () => {
        setTitle('Login');
        history.push('/login')
    };

    const getPasswordStrength = () => {
        let { password } = state;
        return zxcvbn(password).score;
    };

    const getPasswordStrengthClass = () => {
        switch (getPasswordStrength()) {
            case 4:
                return ''; /* Default is blue */
            case 3:
                return 'bg-success'
            case 2:
                return 'bg-warning'
            case 1:
            case 0:
            default:
                return 'bg-danger';
        };
    };

    const getPasswordStrengthWidth = () => {
        const strength = getPasswordStrength();

        return `${strength * 25}${strength > 0 ? '%' : ''}`;
    };

    const getPasswordStrengthDescription = () => {
        switch (getPasswordStrength()) {
            case 4:
                return 'Excellent';
            case 3:
                return 'Good'
            case 2:
                return 'Fair'
            case 1:
                return 'Weak'
            case 0:
            default:
                return 'Very Weak';
        };
    };

    const statusMessageType = statusMessage.type;

    return (
        /* https://getbootstrap.com/docs/4.0/components/forms/#form-groups
            text-muted: https://www.w3schools.com/Bootstrap/bootstrap_ref_css_helpers.asp
            card-body adds the padding
         */
        <div className="card col-12 col-sm-10 col-md-8 col-lg-6 col-xxl-4 mt-2 align-middle text-center">
            <div className={classNames('card-header', {
                'd-none': !statusMessage.message,
                [`bg-${statusMessageType}`]: true,
                'text-light': statusMessageType !== 'warning',
                'text-dark': statusMessageType === 'warning'
            })}>
                {statusMessage.message}
            </div>
            <div className="card-body">
                <form>
                    <div className="mb-3 text-start">
                        <label htmlFor="email">Email Address</label>
                        <input id="email"
                            type="email"
                            required
                            className="form-control"
                            placeholder="Enter email"
                            aria-describedby="emailHelp"
                            value={sessionState.email || ''}
                            onChange={handleSessionStateChange}
                        />
                        <small id="emailHelp" className="form-text text-muted">Your email will not be shared with anyone else.</small>
                    </div>
                    <div className="mb-3 text-start">
                        <label htmlFor="displayName">Display Name</label>
                        <HtmlTooltip title={
                                <>
                                    <b>Requirements</b>
                                    <ul>
                                        <li>Cannot contain '#' (pound/hash)</li>
                                        <li>Does not have to be unique</li>
                                        <li>Can only be changed {Constants.DISPLAY_NAME_CHANGE_DAYS === 1 ? 'once a day' : `every ${Constants.DISPLAY_NAME_CHANGE_DAYS} days`}</li>
                                    </ul>
                                </>
                            }
                            placement="bottom-start"
                            enterDelay={500}
                            disableHoverListener
                            fontWeight='normal'
                        >
                            <input id="displayName"
                                type="text"
                                required
                                className="form-control"
                                placeholder="Enter display name"
                                aria-describedby="displayNameHelp"
                                value={sessionState.displayName || ''}
                                onChange={handleSessionStateChange}
                            />
                        </HtmlTooltip>
                        <small id="displayNameHelp" className="form-text text-muted">This is the name other users will see.  It will be followed by a unique id number unless your account is verified.</small>
                    </div>
                    <div className="mb-3 text-start">
                        <label htmlFor="profileName">Profile Name</label>
                        <HtmlTooltip title={
                                <>
                                    <b>Requirements</b>
                                    <ul>
                                        <li>Should not be the same as your email</li>
                                        <li>20 characters or less</li>
                                        <li>Can only contain the following:
                                            <ul>
                                                <li>a-z</li>
                                                <li>0-9</li>
                                                <li>. (dot)</li>
                                                <li>- (en dash)</li>
                                                <li>_ (underscore)</li>
                                                <li>~ (tilde)</li>
                                            </ul>
                                        </li>
                                        <li>Must be unique</li>
                                    </ul>
                                </>
                            }
                            placement="bottom-start"
                            enterDelay={500}
                            disableHoverListener
                            fontWeight='normal'
                        >
                            <input id="profileName"
                                type="text"
                                required
                                className="form-control"
                                placeholder="Enter profile name"
                                aria-describedby="profileNameHelp"
                                value={sessionState.profileName || ''}
                                onChange={handleSessionStateChange}
                            />
                        </HtmlTooltip>
                        <small id="profileNameHelp" className="form-text text-muted">
                            This will be the URL to your profile, e.g., {`${Constants.BASE_USERS_URL}yourProfileName`}. You will not be able to change it once it is set, so choose it carefully.&nbsp;
                            <HtmlTooltip title={
                                    <>
                                        We reserve the right to change your profile name at a future date if we determine you are trying to impersonate an individual or business.
                                    </>
                                }
                                enterDelay={500}
                                arrow
                                color='rgb(255,0,0)'
                            >
                                <small>(<span className="text-primary text-decoration-underline" style={{cursor: 'help'}}>Note</span>)</small>
                            </HtmlTooltip>
                        </small>
                    </div>
                    <div className="mb-3 text-start">
                        <label htmlFor="password">Password</label>
                        <input id="password"
                            type="password"
                            required
                            className="form-control mb-1"
                            placeholder="Password"
                            value={state.password || ''}
                            onChange={handleStateChange}
                        />
                        <div style={{display: state.password ? '' : 'none'}}>
                            <div className="progress">
                                <div className={classNames('progress-bar bg-gradient', getPasswordStrengthClass())} role="progressbar" style={{width: getPasswordStrengthWidth()}} aria-valuenow={getPasswordStrength()} aria-valuemin="0" aria-valuemax="4"></div>
                            </div>
                            <p>
                                <b>Strength:</b> {getPasswordStrengthDescription()}
                            </p>
                        </div>
                    </div>
                    <div className="mb-3 text-start">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input id="confirmPassword"
                            type="password"
                            required
                            className="form-control"
                            placeholder="Confirm Password"
                            value={state.confirmPassword || ''}
                            onChange={handleStateChange}
                            style={{
                                backgroundColor: state.password === state.confirmPassword ? 'rgb(255,255,255)' : 'rgba(220,53,69,0.5)'
                            }}
                        />
                    </div>
                    <label id="lBelaavnek1" htmlFor="firstName" className="special-control">Skipthis</label>
                    <input id="firstName"
                        aria-labelledby="lBelaavnek1"
                        type="text"
                        required
                        tabIndex="-1"
                        className="form-control mb-1 special-control"
                        placeholder="First Name"
                        value={state.firstName}
                        onChange={handleStateChange}
                    />
                    <label id="lBelaavnek2" htmlFor="lastName" className="special-control">Skipthistoo</label>
                    <input id="lastName"
                        aria-labelledby="lBelaavnek2"
                        type="text"
                        tabIndex="-1"
                        required
                        className="form-control mb-1 special-control"
                        placeholder="Last Name"
                        value={state.lastName}
                        onChange={handleStateChange}
                    />
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
