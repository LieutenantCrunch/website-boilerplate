import React, {useEffect, useState, useRef} from 'react';
import {withRouter} from 'react-router-dom';
import AuthService from '../services/auth.service';
import UserService from '../services/user.service';

function SettingsPage(props) {
    const [settingsPageAlert, setSettingsPageAlert] = useState({type: 'info', message: null});
    const settingsPageAlertEl = useRef(null);
    const [state, setState] = useState({displayName: '', displayNameError: false});
    
    useEffect(() => {
        props.setTitle('Settings');
    }, []);

    useEffect(() => {
        if (state.displayNameError) {
            setTimeout(() => {
                setState(prevState => ({...prevState, displayNameError: false}))
            }, 1000);
        }

    }, [state.displayNameError]);

    const handleLogoutFromEverywhereClick = async () => {
        await AuthService.logout(true, true);
        let logoutConfirm = bootstrap.Modal.getInstance(document.getElementById('logoutConfirm'));
        logoutConfirm.hide();
        props.setUserInfo(null);
        props.setStatusMessage({type: 'info', message: 'You have been logged out from everywhere'});
        props.history.push('/login');
    };

    const handleLogoutFromEverywhereElseClick = async () => {
        await AuthService.logout(false, true);

        let logoutConfirm = bootstrap.Modal.getInstance(document.getElementById('logoutConfirm'));
        logoutConfirm.hide();

        setSettingsPageAlert({type: 'info', message: 'You have successfully logged out of all other sessions.'});

        let settingsPageAlertCollapse = bootstrap.Collapse.getInstance(settingsPageAlertEl.current);
        if (!settingsPageAlertCollapse) {
            settingsPageAlertCollapse = new bootstrap.Collapse(settingsPageAlertEl.current);
            settingsPageAlertEl.current.addEventListener('hidden.bs.collapse', clearSettingsPageAlert);
        }

        settingsPageAlertCollapse.show();
    };

    const handleStateChange = (e) => {
        /* Use destructuring to populate an object with id/value from the event target ({id = event.target.id, value = event.target.value}) */
        const {id, value} = e.target;

        /* Use an arrow function that returns an object literal populated with the prevState (using the spread operator) and with the value set on the property specified by the target's id, pass that into setState */
        setState(prevState => ({
            ...prevState,
            [id] : value
        }));
    };

    const handleDisplayNameFormSubmitClick = () => {
        if (!state.displayName || state.displayName.indexOf('#') > -1) {
            setState(prevState => ({...prevState, displayNameError: true}));
            return;
        }

        let displayNameForm = bootstrap.Modal.getInstance(document.getElementById('displayNameForm'));
        displayNameForm.hide();

        UserService.setDisplayName(state.displayName).then(results => {
            if (results.data.message) {
                let alertType = (results.data.success === true ? 'info' : 'danger');

                setSettingsPageAlert({type: alertType, message: results.data.message});

                let settingsPageAlertCollapse = bootstrap.Collapse.getInstance(settingsPageAlertEl.current);
                if (!settingsPageAlertCollapse) {
                    settingsPageAlertCollapse = new bootstrap.Collapse(settingsPageAlertEl.current);
                    settingsPageAlertEl.current.addEventListener('hidden.bs.collapse', clearSettingsPageAlert);
                }

                settingsPageAlertCollapse.show();
            }

            if (results.data.success) {
                props.setUserDetails({...props.userDetails, displayName: state.displayName, displayNameIndex: results.data.displayNameIndex});
            }
        }, () => {});
    };

    const clearSettingsPageAlert = () => {
        setSettingsPageAlert({type: 'info', message: null});
    };

    return (
        <>
            <div className="container-fluid">
                <div id="settingsPageAlertEl" ref={settingsPageAlertEl} className={`alert alert-${settingsPageAlert.type.toLocaleLowerCase()} alert-dismissible collapse w-100`} role="alert">
                    <strong>{settingsPageAlert.message}</strong>
                    <button type="button" className="btn-close" aria-label="Close" data-target="#settingsPageAlertEl" data-toggle="collapse" aria-expanded="false" aria-controls="settingsPageAlert"></button>
                </div>
                <div className="text-center">
                    <h5 className="font-weight-bold">General</h5>
                    <button type="button" className="btn btn-link" data-toggle="modal" data-target="#displayNameForm">Change Display Name</button>
                    <h5 className="font-weight-bold">Security</h5>
                    <button type="button" className="btn btn-link" data-toggle="modal" data-target="#logoutConfirm">Log out other sessions</button>
                </div>
            </div>
            <div id="logoutConfirm" className="modal fade" tabIndex="-1" data-backdrop="static" data-keyboard="false" aria-labelledby="logoutConfirmLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="logoutConfirmLabel">Log Out Choices</h5>
                            <button type="button" className="btn-close" data-dismiss="modal" aria-label="close"></button>
                        </div>
                        <div className="modal-body">
                            <p>You can log out from everywhere (including here) or everywhere else (excluding here), which would you like to do?</p>
                            <small>If you only want to log out from here, please use the normal menu option.</small>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-primary" onClick={handleLogoutFromEverywhereClick}>Everywhere</button>
                            <button type="button" className="btn btn-primary" onClick={handleLogoutFromEverywhereElseClick}>Everywhere Else</button>
                            <button type="button" className="btn btn-secondary" data-dismiss="modal">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
            <div id="displayNameForm" className="modal fade" tabIndex="-1" data-backdrop="static" aria-labelledby="displayNameChangeLabel" aria-hidden="true">
                <div className={state.displayNameError ? 'callAttentionToError' : ''}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title" id="displayNameChangeLabel">Enter your new display name</h5>
                                <button type="button" className="btn-close" data-dismiss="modal" arial-label="close"></button>
                            </div>
                            <div className="modal-body">
                                <p>Please enter your new display name. Please note that you can only change your display name every {props.appConstants.displayNameChangeDays} day{props.appConstants.displayNameChangeDays === 1 ? '' : 's'}. Names must not contain # and do not have to be unique. They will be followed by a unique id number unless your account is verified.</p>
                                <input type="text" id="displayName" className="form-control" placeholder="Display Name" aria-label="Display name input" value={state.displayName} onChange={handleStateChange} />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-primary" onClick={handleDisplayNameFormSubmitClick}>Submit</button>
                                <button type="button" className="btn btn-secondary" data-dismiss="modal">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default withRouter(SettingsPage);