import React, {useEffect, useState} from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import AuthService from '../services/auth.service';
import classNames from 'classnames';

// Material UI
import FormControl from '@material-ui/core/FormControl';
import IconButton from '@material-ui/core/IconButton';
import InputLabel from '@material-ui/core/InputLabel';
import InputAdornment from '@material-ui/core/InputAdornment';
import FilledInput from '@material-ui/core/FilledInput';
import MaterialTextField from '@material-ui/core/TextField';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';

export const ResetPassword = ({ setLoginDetails, setStatusMessage, setTitle, statusMessage }) => {
    const history = useHistory();
    const location = useLocation();

    const [state, setState] = useState({
        email: '', 
        password: '', 
        confirmPassword: '',
        showPassword: false,
        showConfirmPassword: false
    });

    useEffect(() => {
        setTitle('Reset Password');
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

    const handleShowPassword = (e) => {
        setState(prevState => ({
            ...prevState,
            showPassword: !prevState.showPassword 
         }));
    };

    const handleShowPasswordMouseDown = (e) => {
        e.preventDefault();
    };

    const handleShowConfirmPassword = (e) => {
        setState(prevState => ({
            ...prevState,
            showConfirmPassword: !prevState.showConfirmPassword 
         }));
    };

    const handleShowConfirmPasswordMouseDown = (e) => {
        e.preventDefault();
    };

    const resetPassword = async () => {
        let searchParams = new URLSearchParams(location.search);
        let token = searchParams.get('token');
        let results = await AuthService.resetPassword(token, state.email, state.password, state.confirmPassword);

        setStatusMessage(results.statusMessage);
        if (results.success) {
            setLoginDetails(null);
            redirectToLogin();
        }
    };

    const redirectToLogin = () => {
        setTitle('Login');
        history.push('/login')
    };

    const statusMessageType = statusMessage.type;

    return (
        <>
            <div className="card col-8 col-md-4 mt-2 align-middle text-center">
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
                            <MaterialTextField id="email"
                                type="email"
                                aria-describedby="emailHelp"
                                label="Email Address"
                                onChange={handleStateChange}
                                required
                                size="small"
                                style={{ width: '100%' }}
                                value={sessionState.email || ''}
                                variant="filled"
                            />
                            <small id="emailHelp" className="form-text text-muted">Please confirm your email</small>
                        </div>
                        <div className="mb-3 text-start">
                            <FormControl required variant="filled" size="small" style={{ width: '100%' }}>
                                <InputLabel htmlFor="password">New Password</InputLabel>
                                <FilledInput
                                    id="password"
                                    type={state.showPassword ? 'text' : 'password'}
                                    required
                                    value={state.password || ''}
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
                        </div>
                        <div className="mb-3 text-start">
                            <FormControl required variant="filled" size="small" style={{ width: '100%' }} color={ state.password === state.confirmPassword ? 'primary' : 'error' }>
                                <InputLabel htmlFor="confirmPassword">Confirm New Password</InputLabel>
                                <FilledInput
                                    id="confirmPassword"
                                    type={state.showConfirmPassword ? 'text' : 'password'}
                                    color={ state.password === state.confirmPassword ? 'primary' : 'error' }
                                    required
                                    value={state.confirmPassword || ''}
                                    onChange={handleStateChange}
                                    endAdornment={
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle confirm password visibility"
                                                onClick={handleShowConfirmPassword}
                                                onMouseDown={handleShowConfirmPasswordMouseDown}
                                                edge="end"
                                            >
                                                {
                                                    state.showConfirmPassword 
                                                    ? <Visibility /> 
                                                    : <VisibilityOff />
                                                }
                                            </IconButton>
                                        </InputAdornment>
                                    }
                                    
                                sx={{
                                    backgroundColor: state.password === state.confirmPassword ? '' : 'rgba(220,53,69,0.5)',
                                    '&:hover': {
                                        backgroundColor: state.password === state.confirmPassword ? '' : 'rgba(220,53,69,0.6)',
                                    }
                                }}
                                />
                            </FormControl>
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
