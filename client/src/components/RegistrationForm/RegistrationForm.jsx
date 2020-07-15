// https://medium.com/technoetics/create-basic-login-forms-using-react-js-hooks-and-bootstrap-2ae36c15e551
import React, {useState} from 'react';
import Axios from 'axios';
import { withRouter } from 'react-router-dom';

import * as Constants from '../../constants/constants';
import * as Hooks from '../../hooks/hooks';

function RegistrationForm(props) {
    const [state, setState] = Hooks.useStateWithSessionStorage('state', {email: '', password: '', confirmPassword: ''});
    const [successMessage, setSuccessMessage] = useState(null);

    const handleChange = (e) => {
        /* Use destructuring to populate an object with id/value from the event target ({id = event.target.id, value = event.target.value}) */
        const {id, value} = e.target;

        /* Use an arrow function that returns an object literal populated with the prevState (using the spread operator) and with the value set on the property specified by the target's id, pass that into setState */
        setState(prevState => ({
            ...prevState,
            [id] : value
        }));
    };

    const handleSubmitClick = (e) => {
        e.preventDefault();
        // This needs to be converted to leverage some better type of Form validation, whether HTML 5 or something else
        if (!state.email.length) {
            alert ('You must enter an email');
        }
        else if (state.password === state.confirmPassword) {
            if (!state.password.length) {
                alert('You must enter a password');
            }
            else {
                sendRegistrationToServer();
            }
        }
        else {
            alert('Passwords do not match');
        }
    };

    const sendRegistrationToServer = () => {
        const payload = {
            "email": state.email,
            "password": state.password
        };

        Axios.post(Constants.BASE_API_URL + Constants.API_PATH_USERS + 'register', payload).then((response) => {
            if (response.status === 200) {
                alert((response.data.success ? 'Success' : 'Failure') + ': ' + (response.data.message ? response.data.message : 'No Message'));
                setSuccessMessage('Registration successful, redirecting to application');
            }
            else if (response.status === 202) {
                alert((response.data.success ? 'Success' : 'Failure') + ': ' + (response.data.message ? response.data.message : 'No Message'));
            }
            else {
                alert('Failed to register, response code: ' + response.status);
            }
        }).catch(error => {
            alert(error);
        });
    };

    const redirectToLogin = () => {
        props.updateTitle('Login');
        props.history.push('/login')
    };

    return (
        /* https://getbootstrap.com/docs/4.0/components/forms/#form-groups
            text-muted: https://www.w3schools.com/Bootstrap/bootstrap_ref_css_helpers.asp
            card-body adds the padding
         */
        <div className="card col-8 col-md-4 mt-2 align-middle text-center">
            <div className="card-header">
                {props.statusMessage}
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
                            value={state.email}
                            onChange={handleChange}
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
                            onChange={handleChange}
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
                            onChange={handleChange}
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