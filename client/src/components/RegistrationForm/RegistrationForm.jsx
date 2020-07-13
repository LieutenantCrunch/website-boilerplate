// https://medium.com/technoetics/create-basic-login-forms-using-react-js-hooks-and-bootstrap-2ae36c15e551
import React, {useState} from 'react';
import * as Constants from '../../constants/constants';
import Axios from 'axios';
import { withRouter } from 'react-router-dom';

function RegistrationForm(props) {
    const [state, setState] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    });

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

        Axios.post(Constants.BASE_API_URL + 'user-register', payload).then((response) => {
            if (response.data.code === 200) {
                setState(prevState => ({
                    ...prevState,
                    'successMessage': 'Registration successful, redirecting to application'
                }));
            }
            else {
                alert('Failed to register');
            }
        }).catch(error => {
            alert('An error has occurred');
        });
    };

    return (
        /* https://getbootstrap.com/docs/4.0/components/forms/#form-groups
            text-muted: https://www.w3schools.com/Bootstrap/bootstrap_ref_css_helpers.asp
            card-body adds the padding
         */
        <div className="card col-4 mt-2 align-middle text-center">
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
        </div>
    );
};

// Wrap in withRouter so it can get access to props.history
export default withRouter(RegistrationForm);