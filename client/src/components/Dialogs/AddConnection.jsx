import React, {useState, useRef, useEffect} from 'react';
import classNames from 'classnames';
import UserSearch from '../FormControls/UserSearch';
import UserService from '../../services/user.service';
import ConnectionButton from '../FormControls/ConnectionButton';

import { selectUserById, upsertUser } from '../../redux/users/usersSlice';
import { useDispatch, useSelector } from 'react-redux';

export default function AddConnectionDialog (props) {
    const dispatch = useDispatch();
    const [selectedUserId, setSelectedUserId] = useState(null);
    const userSearch = useRef();
    const user = useSelector(state => selectUserById(state, selectedUserId));

    const onUserSelect = async (selectedUserId) => {
        if (selectedUserId !== '') {
            let selectedUserDetails = await UserService.getUserDetails(selectedUserId);

            if (selectedUserDetails) {
                dispatch(upsertUser(selectedUserDetails));
            }
        }

        setSelectedUserId(selectedUserId);
    }

    const clearSelectedUser = (event) => {
        setSelectedUserId(null);

        userSearch.current.clearInput();
    };

    return (
        <div id={props.id} className="modal fade" data-backdrop="static" tabIndex="-1" aria-labelledby="connectionDetailsLabel" aria-hidden="true">
            <div>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header card-header">
                            <h5 className="modal-title" id="connectionDetailsLabel">Add New Connection</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" arial-label="close" onClick={clearSelectedUser}></button>
                        </div>
                        <div className="modal-body card-body">
                            <UserSearch ref={userSearch} className="w-100" onUserSelect={onUserSelect} selectAllOnFocus={true} excludeConnections={true} />
                        </div>
                        <div className="modal-body card-body" style={{
                                display: selectedUserId ? '' : 'none'
                            }}
                        >
                            <p className="text-center">
                                <img src={user?.pfp} className="border rounded-circle w-25" />
                            </p>
                            <div className="text-center">
                                <h5 className="text-center">{user?.displayName}<small className="text-muted">#{user?.displayNameIndex}</small></h5>
                            </div>
                        </div>
                        <div className="modal-footer card-footer justify-content-end">
                            <small style={{
                                display: selectedUserId ? '' : 'none',
                                marginRight: 'auto'
                            }}>
                                <a href={`/u/${user?.profileName}`}>View Profile</a>
                            </small>
                            <span style={{display: selectedUserId ? '' : 'none'}}>
                                <ConnectionButton uniqueId={selectedUserId} />
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}