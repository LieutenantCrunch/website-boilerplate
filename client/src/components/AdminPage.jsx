import React, {useState, useRef} from 'react';
import AdminHeader from './AdminHeader';
import {BrowserRouter as Router} from 'react-router-dom';
import UserService from '../services/user.service';
import UserSearch from './UserSearch';

export default function AdminPage() {
    const [title, setTitle] = useState('Admin Panel');
    const [state, setState] = useState({
        loading: false,
        userSearchPage: 0,
        userSearchTotal: 0,
        selectedUserDetails: null,
        confirmTitle: '',
        confirmMessage: '',
        confirmCb: null,
        adminPageAlert: {
            type: 'danger',
            message: null
        }
    });

    const adminPageAlertEl = useRef();

    const clearAdminPageAlert = () => {
        setState(prevState => {
            return {...prevState, adminPageAlert: {
                type: 'danger',
                message: null
            }};
        })
    };

    const onUserSelect = async (selectedUserId) => {
        let selectedUserDetails = null;

        if (selectedUserId !== '') {
            selectedUserDetails = await UserService.getUserDetails(selectedUserId);
        }

        setState(prevState => {
            return {...prevState, selectedUserDetails};
        });
    }

    const verifyDisplayName = async (event) => {
        // Make call to api
        // Update selectedUserDetails if success
        let results = await UserService.verifyDisplayName(state.selectedUserDetails.uniqueID, state.selectedUserDetails.displayName);

        if (results.success) {
            setState(prevState => {
                return {...prevState, selectedUserDetails: {
                    ...prevState.selectedUserDetails,
                    displayNameIndex: 0
                }}
            });
        }
        else if (results.message) {
            setState(prevState => {
                return {...prevState, adminPageAlert: {
                    type: 'danger',
                    message: results.message
                }};
            });

            let adminPageAlertCollapse = bootstrap.Collapse.getInstance(adminPageAlertEl.current);
            if (!adminPageAlertCollapse) {
                adminPageAlertCollapse = new bootstrap.Collapse(adminPageAlertEl.current);
                adminPageAlertEl.current.addEventListener('hidden.bs.collapse', clearAdminPageAlert);
            }

            adminPageAlertCollapse.show();
        }
    };

    const handleVerifyDisplayNameClick = async (event) => {
        // Confirm they want to proceed - the message should display automatically
        // Hook up the callback for when they confirm
        setState(prevState => {
            return {
                ...prevState, 
                confirmTitle: 'Confirm Verification',
                confirmMessage: 'Are you sure you want to verify this display name? A display name can only be verified once.',
                confirmCb: verifyDisplayName
            }
        });
    };

    const handleConfirmYesClick = async (event) => {
        // Call the callback if it exists
        if (state.confirmCb) {
            state.confirmCb(event);
        }

        // Update the state to clear out the message properties
        setState(prevState => {
            return {...prevState, confirmTitle: '', confirmMessage: '', confirmCb: null};
        });
    };

    const handleConfirmNoClick = async (event) => {
        // Update the state to clear out the message properties
        setState(prevState => {
            return {...prevState, confirmTitle: '', confirmMessage: '', confirmCb: null};
        });
    };

    return (
        <div>
            <Router>
                <AdminHeader  title={title} />
                <div id="adminPageAlertEl" 
                    ref={adminPageAlertEl} 
                    className={`alert alert-${state.adminPageAlert.type.toLocaleLowerCase()} alert-dismissible collapse w-100 fixed-top`} 
                    role="alert"
                    style={{
                        marginTop: '56px' /* Push it below the top nav bar. Not ideal, but it works for now */
                    }}
                >
                    <strong>{state.adminPageAlert.message}</strong>
                    <button type="button" className="btn-close" aria-label="Close" data-target="#adminPageAlertEl" data-toggle="collapse" aria-expanded="false" aria-controls="adminPageAlert"></button>
                </div>
                <div className="container-fluid d-flex align-items-center flex-column mt-2">
                    <div className="card col-8 col-md-4 align-middle text-center">
                        <div className="card-header">
                            <h5 className="card-title">User Management</h5>
                        </div>
                        <div className="card-body">
                            <UserSearch className="w-100" onUserSelect={onUserSelect} selectAllOnFocus={true} />
                        </div>
                        <div className="card-body border-top"
                            style={
                                {
                                    display: state.selectedUserDetails ? '' : 'none'
                                }
                            }
                        >
                            <img src={state.selectedUserDetails?.pfp}
                                className={'border border-dark rounded-circle mb-2'}
                                style={{
                                    maxWidth: '25%'
                                }}
                            />
                            <h5 className="card-subtitle mb-2 font-weight-bold">{state.selectedUserDetails?.displayName}</h5>
                            <div className="card-text text-left">
                                <span className="font-weight-bold">Display Name Index:</span> {state.selectedUserDetails?.displayNameIndex}<br />
                                <span className="font-weight-bold">Email:</span> {state.selectedUserDetails?.email}<br/>
                                <span className="font-weight-bold">Roles:</span><br />
                                <ul className="font-weight-light">
                                    {
                                        (state.selectedUserDetails?.roles && state.selectedUserDetails?.roles.length > 0)
                                        ? state.selectedUserDetails?.roles.map(role => {
                                            return <li key={role}>{role}</li>
                                        })
                                        : <li className="font-italic">None</li>
                                    }
                                </ul>
                            </div>
                        </div>
                        <div className="card-body border-top"
                            style={
                                {
                                    display: state.selectedUserDetails ? '' : 'none'
                                }
                            }
                        >
                            <h5 className="card-subtitle mb-4 font-weight-bold">Actions</h5>
                            <div className="card-text">
                                <button type="button" 
                                    className="btn btn-primary"
                                    onClick={handleVerifyDisplayNameClick}
                                    data-toggle="modal" 
                                    data-target="#adminPageConfirm">Verify Display Name</button>
                            </div>
                        </div>
                        <div className="card-footer">

                        </div>
                    </div>
                </div>
                <div id="adminPageConfirm" className="modal fade" tabIndex="-1" data-backdrop="static" aria-labelledby="adminPageConfirmLabel" aria-hidden="true">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title" id="adminPageConfirmLabel">{state.confirmTitle}</h5>
                                <button type="button" 
                                    className="btn-close" 
                                    onClick={handleConfirmNoClick}
                                    data-dismiss="modal" 
                                    arial-label="close"
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>{state.confirmMessage}</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" 
                                    className="btn btn-primary" 
                                    onClick={handleConfirmYesClick}
                                    data-dismiss="modal" 
                                >
                                    Yes
                                </button>
                                <button type="button" 
                                    className="btn btn-secondary" 
                                    onClick={handleConfirmNoClick}
                                    data-dismiss="modal"
                                >
                                    No
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Router>
        </div>
    );
}