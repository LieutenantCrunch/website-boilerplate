import React, {useEffect, useState, useRef} from 'react';
import {withRouter} from 'react-router-dom';
import AuthService from '../services/auth.service';

function SecurityPage(props) {
    const [securityPageAlert, setSecurityPageAlert] = useState({type: 'info', message: null});
    const securityPageAlertEl = useRef(null);

    useEffect(() => {
        props.setTitle('Security');
    }, []);

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

        setSecurityPageAlert({type: 'info', message: 'You have successfully logged out of all other sessions.'});

        let securityPageAlertCollapse = bootstrap.Collapse.getInstance(securityPageAlertEl.current);
        if (!securityPageAlertCollapse) {
            securityPageAlertCollapse = new bootstrap.Collapse(securityPageAlertEl.current);
            securityPageAlertEl.current.addEventListener('hidden.bs.collapse', clearSecurityPageAlert);
        }

        securityPageAlertCollapse.show();
    };

    const clearSecurityPageAlert = () => {
        setSecurityPageAlert({type: 'info', message: null});
    };

    return (
        <>
            <div id="securityPageAlertEl" ref={securityPageAlertEl} className={`alert alert-${securityPageAlert.type.toLocaleLowerCase()} alert-dismissible collapse w-100`} role="alert">
                <strong>{securityPageAlert.message}</strong>
                <button type="button" className="close" aria-label="Close" data-target="#securityPageAlertEl" data-toggle="collapse" aria-expanded="false" aria-controls="securityPageAlert">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div>
                <button type="button" className="btn btn-link" data-toggle="modal" data-target="#logoutConfirm">Log out other sessions</button>
            </div>
            <div id="logoutConfirm" className="modal fade" tabIndex="-1" data-backdrop="static" data-keyboard="false" aria-labelledby="logoutConfirmLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="logoutConfirmLabel">Log Out Choices</h5>
                            <button type="button" className="close" data-dismiss="modal" aria-label="close">
                                <span aria-hidden="true">&times;</span>
                            </button>
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
        </>
    );
};

export default withRouter(SecurityPage);