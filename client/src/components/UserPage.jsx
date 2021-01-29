import React, { useEffect, useRef, useState } from 'react';
import { Redirect, Route, useParams, useRouteMatch, withRouter } from 'react-router-dom';
import classNames from 'classnames';
import { usePopper } from 'react-popper';

import ProfilePicture from './ProfilePicture';
import UserService from '../services/user.service';

function User (props) {
    const { profileName } = useParams();
    const [profileInfo, updateProfileInfo] = useState({});

    const dropdownMenuContainer = useRef();
    const [referenceElement, setReferenceElement] = useState(null);
    const [popperElement, setPopperElement] = useState(null);
    const { styles, update } = usePopper(referenceElement, popperElement, {
        modifiers: [
        ],
        placement: 'bottom-start'
    });
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        UserService.getProfileInfo(profileName).then((profileInfo) => {
            let title = profileInfo.displayName;
            if (profileInfo.displayNameIndex > 0) {
                title += `#${profileInfo.displayNameIndex}`;
            }

            props.setTitle(`${title}'s Profile`);

            updateProfileInfo(profileInfo);
        }).catch((reason) => {
            console.error(reason);
        });
    }, []);

    const toggleDropdown = (event) => {
        update(); // This fixes the position of the dropdown menu
        setIsDropdownOpen(!isDropdownOpen);
        event.stopPropagation();
    };

    const handleTypeChange = (event) => {
        let { name, checked } = event.target;

        updateProfileInfo({
            ...profileInfo,
            connectionTypes: {
                ...profileInfo.connectionTypes,
                [name]: checked
            }
        });
    };

    return <div className="card col-8 col-md-4 mt-2 align-middle text-center">
        <div className="card-header">
            <ProfilePicture pfpSmall={profileInfo.pfpSmall || ''} />
        </div>
        <div className="card-body">
            <h5 className="card-title">{profileInfo.displayName || ''}
                {
                    profileInfo.displayNameIndex && profileInfo.displayNameIndex > 0
                    ? <small className="text-muted">#{profileInfo.displayNameIndex}</small>
                    : <></>
                }
            </h5>
        </div>
        {
            props.checkForValidSession()
            ? <div className="card-footer text-right">
                <div ref={dropdownMenuContainer} className="dropdown">
                    <button ref={setReferenceElement} type="button" className={classNames('btn', 'btn-outline-primary', 'dropdown-toggle', {'show': isDropdownOpen})} id="connectionTypeDropdownButton" onClick={toggleDropdown}>
                        Relationship
                    </button>
                    <div ref={setPopperElement} className={classNames('dropdown-menu', 'px-2', {'show': isDropdownOpen})} style={styles.popper} {...styles.popper}>
                        {
                            profileInfo.connectionTypes
                            ? Object.entries(profileInfo.connectionTypes).map(([connectionType, details]) => (
                                <SwitchCheckbox key={connectionType} label={connectionType} isChecked={details} onSwitchChanged={handleTypeChange} />
                            ))
                            : <></>
                        }
                    </div>
                </div>
            </div>
            : <></>
        }
    </div>;
}

function UserPage (props) {
    const { url } = useRouteMatch();

    return <>
        <Route path={`${url}/:profileName`}>
            <User 
                appConstants={props.appConstants}
                checkForValidSession={props.checkForValidSession}
                setTitle={props.setTitle}
            />
        </Route>
        <Route path={`${url}`} exact={true} render={() => {
                return (
                    props.checkForValidSession()
                    ? <Redirect to="/profile" />
                    : <Redirect to="/login" />
                );
            }}
        />
    </>;
}

export default withRouter(UserPage);