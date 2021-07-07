import React, {useState, useRef} from 'react';
import { AdminHeader } from './AdminHeader';
import {BrowserRouter as Router} from 'react-router-dom';
import UserService from '../services/user.service';
import UserSearch from './FormControls/UserSearch';

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
        adminPageAlertCollapse: null
    });
    const [adminPageAlertMessage, setAdminPageAlertMessage] = useState({ type: 'danger', message: null });

    const adminPageAlert = useRef();

    // adminPageAlert.current
    useEffect(() => {
        let adminPageAlertEl = adminPageAlert.current;

        if (adminPageAlertEl) {
            let adminPageAlertCollapse = new bootstrap.Collapse(adminPageAlertEl, {
                toggle: false
            });

            adminPageAlertEl.addEventListener('hidden.bs.collapse', clearAdminPageAlert);

            setState(prevState => ({
                ...prevState,
                adminPageAlertCollapse
            }));
            
            return () => {
                adminPageAlertEl.removeEventListener('hidden.bs.collapse', clearAdminPageAlert);
            };
        }
    }, [adminPageAlert.current]);

    const showAdminPageAlert = () => {
        let { adminPageAlertCollapse } = state;

        if (adminPageAlertCollapse) {
            adminPageAlertCollapse.show();
        }
    };

    const hideAdminPageAlert = () => {
        let { adminPageAlertCollapse } = state;

        if (adminPageAlertCollapse) {
            adminpageAlertCollapse.hide();
        }
    };

    const clearAdminPageAlert = () => {
        setAdminPageAlertMessage({ type: 'danger', message: null });
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
        let results = await UserService.verifyDisplayName(state.selectedUserDetails.uniqueId, state.selectedUserDetails.displayName);

        if (results.success) {
            setState(prevState => {
                return {...prevState, selectedUserDetails: {
                    ...prevState.selectedUserDetails,
                    displayNameIndex: 0
                }}
            });
        }
        else if (results.message) {
            setAdminPageAlertMessage({ type: 'danger', message: results.message });
            showAdminPageAlert();
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
                <div id="adminPageAlert" 
                    ref={adminPageAlert} 
                    className={`alert alert-${state.adminPageAlertMessage.type.toLocaleLowerCase()} alert-dismissible collapse w-100 fixed-top`} 
                    role="alert"
                    style={{
                        marginTop: '56px' /* Push it below the top nav bar. Not ideal, but it works for now */
                    }}
                >
                    <strong>{adminPageAlertMessage.message}</strong>
                    <button type="button" className="btn-close" aria-label="Close" data-bs-target="#adminPageAlert" data-bs-toggle="collapse" aria-expanded="false" aria-controls="adminPageAlert"></button>
                </div>
                <div className="container-fluid d-flex align-items-center flex-column mt-2">
                    <div className="card col-12 col-sm-10 col-md-8 col-lg-6 col-xxl-4 align-middle text-center">
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
                            <div className="card-text text-start">
                                <span className="font-weight-bold">Display Name Index:</span> {state.selectedUserDetails?.displayNameIndex}<br />
                                <span className="font-weight-bold">Email:</span> {state.selectedUserDetails?.email}<br/>
                                <span className="font-weight-bold">Roles:</span><br />
                                <ul className="font-weight-light">
                                    {
                                        (state.selectedUserDetails?.roles && state.selectedUserDetails?.roles.length > 0)
                                        ? state.selectedUserDetails?.roles.map(role => {
                                            return <li key={role}>{role}</li>
                                        })
                                        : <li key="None" className="font-italic">None</li>
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
                                    data-bs-toggle="modal" 
                                    data-bs-target="#adminPageConfirm">Verify Display Name</button>
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
                                    data-bs-dismiss="modal" 
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
                                    data-bs-dismiss="modal" 
                                >
                                    Yes
                                </button>
                                <button type="button" 
                                    className="btn btn-secondary" 
                                    onClick={handleConfirmNoClick}
                                    data-bs-dismiss="modal"
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