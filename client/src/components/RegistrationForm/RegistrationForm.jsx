// https://medium.com/technoetics/create-basic-login-forms-using-react-js-hooks-and-bootstrap-2ae36c15e551
import React, {useState} from 'react';

export default function RegistrationForm(props) {
    const [state, setState] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        /* Use destructuring to populate an object with id/value from the event target ({id = event.target.id, value = event.target.value}) */
        const {id, value} = e.target;

        /* Use the spread operator to populate prevState with whatever it previously contained, use the id of the target for the property on the state and set value on it */
        setState(prevState => ({
            ...prevState,
            [id] : value
        }));
    };

    const handleSubmitClick = (e) => {
        e.preventDefault();
        if (state.password === state.confirmPassword) {
            alert('Success!');
        }
        else {
            alert('Passwords do not match');
        }
    };

    return (
        /* https://getbootstrap.com/docs/4.0/components/forms/#form-groups
            text-muted: https://www.w3schools.com/Bootstrap/bootstrap_ref_css_helpers.asp
            card-body adds the padding
         */
        <div className="card col-4 offset-4 mt-2 align-middle text-center">
            <div className="card-body">
                <form>
                    <div className="mb-3 text-left">
                        <label htmlFor="email">Email Address</label>
                        <input id="email"
                            type="email"
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
