// https://medium.com/technoetics/create-basic-login-forms-using-react-js-hooks-and-bootstrap-2ae36c15e551
import React, {useState} from 'react';
import Axios from 'axios';
import { withRouter } from 'react-router-dom';

import * as Constants from '../../constants/constants';
import * as Hooks from '../../hooks/hooks';

function LoginForm (props) {
    const [state, setState] = Hooks.useStateWithSessionStorage('state', {email: '', password: ''});
    const [successMessage, setSuccessMessage] = useState(null);

    const handleChange = (e) => {
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
        if (!state.email.length) {
            alert ('You must enter an email');
        }
        else if (!state.password.length) {
            alert('You must enter a password');
        }
        else {
            sendCredentialsToServer();
        }
    };

    const sendCredentialsToServer = () => {
        const payload = {
            "email": state.email,
            "password": state.password
        };

        Axios.post(Constants.BASE_API_URL + Constants.API_PATH_USERS + 'login', payload).then((response) => {
            if (response.status === 200) {
                setSuccessMessage('Login successful, redirecting to application');
                redirectToProfile();
            }
            else if (response.status === 204) {
                alert('Username and password do not match');
            }
            else {
                alert('Failed to log in, response code: ' + response.status);
            }
        }).catch(error => {
            alert(error);
        });
    };

    const redirectToProfile = () => {
        props.updateTitle('My Profile');
        props.history.push('/profile');
    };

    const redirectToRegistration = () => {
        props.updateTitle('Register');
        props.history.push('/register')
    };

    return (
        <div className="card col-8 col-md-4 mt-2 align-middle text-center">
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