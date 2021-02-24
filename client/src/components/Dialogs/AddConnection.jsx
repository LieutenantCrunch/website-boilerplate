import React, {useState, useRef, useEffect} from 'react';
import classNames from 'classnames';
import UserSearch from '../UserSearch';
import UserService from '../../services/user.service';
import ConnectionButton from '../FormControls/ConnectionButton';

export default function AddConnectionDialog (props) {
    const [state, updateState] = useState({
        selectedUserDetails: null
    });
    const userSearch = useRef();

    const onUserSelect = async (selectedUserId) => {
        let selectedUserDetails = null;

        if (selectedUserId !== '') {
            selectedUserDetails = await UserService.getUserDetails(selectedUserId);
        }

        updateState(prevState => {
            return {...prevState, selectedUserDetails};
        });
    }

    const clearSelectedUser = (event) => {
        updateState(prevState => {
            return {...prevState, selectedUserDetails: null};
        });

        userSearch.current.clearInput();
    };

    return (
        <div id={props.id} className="modal fade" data-backdrop="static" tabIndex="-1" aria-labelledby="connectionDetailsLabel" aria-hidden="true">
            <div>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header card-header">
                            <h5 className="modal-title" id="connectionDetailsLabel">Add New Connection</h5>
                            <button type="button" className="btn-close" data-dismiss="modal" arial-label="close" onClick={clearSelectedUser}></button>
                        </div>
                        <div className="modal-body card-body">
                            <UserSearch ref={userSearch} className="w-100" onUserSelect={onUserSelect} selectAllOnFocus={true} excludeConnections={true} />
                        </div>
                        <div className="modal-body card-body" style={{
                                display: state.selectedUserDetails ? '' : 'none'
                            }}
                        >
                            <p className="text-center">
                                <img src={state.selectedUserDetails?.pfp} className="border rounded-circle w-25" />
                            </p>
                            <div className="text-center">
                                <h5 className="text-center">{state.selectedUserDetails?.displayName}<small className="text-muted">#{state.selectedUserDetails?.displayNameIndex}</small></h5>
                            </div>
                        </div>
                        <div className="modal-footer card-footer justify-content-end">
                            <small style={{
                                display: state.selectedUserDetails ? '' : 'none',
                                marginRight: 'auto'
                            }}>
                                <a href={`/u/${state.selectedUserDetails?.profileName}`}>View Profile</a>
                            </small>
                            <span style={{display: state.selectedUserDetails ? '' : 'none'}}>
                                <ConnectionButton connection={state.selectedUserDetails} />
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}