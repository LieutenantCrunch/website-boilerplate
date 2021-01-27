// https://medium.com/technoetics/create-basic-login-forms-using-react-js-hooks-and-bootstrap-2ae36c15e551
import React, {useState} from 'react';
import { withRouter } from 'react-router-dom';
import classNames from 'classnames';
import zxcvbn from 'zxcvbn';

import * as Hooks from '../../hooks/hooks';
import AuthService from '../../services/auth.service';

import { HtmlTooltip } from '../HtmlTooltip';
import Zoom from '@material-ui/core/Zoom';

function RegistrationForm(props) {
    const [state, setState] = useState({password: '', confirmPassword: ''});
    const [sessionState, setSessionState] = Hooks.useStateWithSessionStorage('state', {
        email: '', 
        displayName: '',
        profileName: ''
    });
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
        else if (!sessionState.displayName.length || sessionState.displayName.indexOf('#') > -1) {
            setStatusMessage({type: 'danger', message: 'You must enter a display name and it must not contain #. Note that it does not have to be unique.'});
        }
        else if (!sessionState.profileName.length || !props.appConstants.ProfileNameRegex.test(sessionState.profileName)) {
            setStatusMessage({type: 'danger', message: 'You must enter a profile name, it must contain at least three alphanumeric characters, and may only contain the following symbols: - | . | _ | ~.'});
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
            setSessionState(prevSessionState => ({
                ...prevSessionState,
                displayName: ''
            }));

            redirectToLogin();
        }
    };

    const redirectToLogin = () => {
        props.setTitle('Login');
        props.history.push('/login')
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
                            value={sessionState.email || ''}
                            onChange={handleSessionStateChange}
                        />
                        <small id="emailHelp" className="form-text text-muted">Your email will not be shared with anyone else.</small>
                    </div>
                    <div className="mb-3 text-left">
                        <label htmlFor="displayName">Display Name</label>
                        <HtmlTooltip title={
                                <>
                                    <b>Requirements</b>
                                    <ul>
                                        <li>Cannot contain '#' (pound/hash)</li>
                                        <li>Does not have to be unique</li>
                                        <li>Can only be changed {props.appConstants.DisplayNameChangeDays === 1 ? 'once a day' : `every ${props.appConstants.DisplayNameChangeDays} days`}</li>
                                    </ul>
                                </>
                            }
                            placement="bottom-start"
                            TransitionComponent={Zoom}
                            enterDelay={500}
                            interactive
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
                    <div className="mb-3 text-left">
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
                            TransitionComponent={Zoom}
                            enterDelay={500}
                            interactive
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
                            This will be the URL to your profile, e.g., {`${props.appConstants.URLs && props.appConstants.URLs.BASE_USERS_URL ? props.appConstants.URLs.BASE_USERS_URL : 'https://this-site.com/' }yourProfileName`}. You will not be able to change it once it is set, so choose it carefully.&nbsp;
                            <HtmlTooltip title={
                                    <>
                                        We reserve the right to change your profile name at a future date if we determine you are trying to impersonate an individual or business.
                                    </>
                                }
                                TransitionComponent={Zoom}
                                enterDelay={500}
                                arrow
                                interactive
                                color='rgb(255,0,0)'
                            >
                                <small>(<span className="text-primary text-decoration-underline" style={{cursor: 'help'}}>Note</span>)</small>
                            </HtmlTooltip>
                        </small>
                    </div>
                    <div className="mb-3 text-left">
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
                    <div className="mb-3 text-left">
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