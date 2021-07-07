import React, { useContext, useEffect, useMemo, useState, useRef } from 'react';
import classNames from 'classnames';
import debounce from 'lodash/debounce';
import { isMobile } from 'react-device-detect';
import { usePopper } from 'react-popper';
import { useHistory } from 'react-router-dom';
import * as Constants from '../constants/constants';
import { MESSAGE_BOX_TYPES } from './Dialogs/MessageBox';

// Components
import { HtmlTooltip } from './HtmlTooltip';
import SwitchCheckbox from './FormControls/SwitchCheckbox';

// Contexts
import { MessageBoxUpdaterContext } from './../contexts/withMessageBox';

// Services
import AuthService from '../services/auth.service';
import UserService from '../services/user.service';

// Utilities
import { newArrayWithItemRemoved } from '../utilities/ArrayUtilities';

// Material UI
import { makeStyles, withStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Divider from '@material-ui/core/Divider';
import MuiGrid from '@material-ui/core/Grid';
import MuiList from '@material-ui/core/List';
import MuiListItem from '@material-ui/core/ListItem';
import MuiListItemText from '@material-ui/core/ListItemText';
import MuiSlider from '@material-ui/core/Slider';
import MuiSwitch from '@material-ui/core/Switch';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import VolumeOffRoundedIcon from '@material-ui/icons/VolumeOffRounded';
import VolumeUpRoundedIcon from '@material-ui/icons/VolumeUpRounded';
import VolumeDownRoundedIcon from '@material-ui/icons/VolumeDownRounded';

const PrimarySwitch = withStyles({
    switchBase: {
        '&$checked': {
            color: 'rgb(11,94,215) !important'
        },
        '&$checked + $track': {
            backgroundColor: 'rgb(11,94,215) !important'
        }
    },
    checked: {},
    track: {}
})(MuiSwitch);

const DangerSwitch = withStyles({
    switchBase: {
        '&$checked': {
            color: 'rgb(220,53,69) !important'
        },
        '&$checked + $track': {
            backgroundColor: 'rgb(220,53,69) !important'
        }
    },
    checked: {},
    track: {}
})(MuiSwitch);

const PrimarySlider = withStyles({
    root: {
        color: 'rgb(11,94,215) !important'
    },
    thumb: {
        backgroundColor: 'currentColor !important'
    }
})(MuiSlider);

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { reduxLogout } from '../redux/rootReducer';
import { selectConnectionTypes } from '../redux/connections/connectionTypesSlice';
import {
    currentUserAllowPublicAccessUpdated, 
    currentUserDisplayNameUpdated, 
    currentUserPreferencesUpdated, 
    selectCurrentUserAllowPublicAccess, 
    selectCurrentUserDisplayName, 
    selectCurrentUserDisplayNameIndex, 
    selectCurrentUserEmail, 
    selectCurrentUserPreferences,
    selectCurrentUserProfileName
} from '../redux/users/currentUserSlice';

const useStyles = makeStyles(() => ({
    preferenceHeader: {
        padding: '.5em 0',
    },
    preferenceInput: {
        marginLeft: '.25em'
    }
}));

export const SettingsPage = ({ setLoginDetails, setStatusMessage, setTitle }) => {
    const dispatch = useDispatch();
    const history = useHistory();
    const setMessageBoxOptions = useContext(MessageBoxUpdaterContext);

    const defaultConnectionTypes = useSelector(selectConnectionTypes);
    const currentUserAllowPublicAccess = useSelector(selectCurrentUserAllowPublicAccess);
    const currentUserDisplayName = useSelector(selectCurrentUserDisplayName);
    const currentUserDisplayNameIndex = useSelector(selectCurrentUserDisplayNameIndex);
    const currentUserEmail = useSelector(selectCurrentUserEmail);
    const currentUserPreferences = useSelector(selectCurrentUserPreferences);
    const currentUserProfileName = useSelector(selectCurrentUserProfileName);

    const classes = useStyles();

    const [state, setState] = useState({
        audienceChanged: false,
        connectionTypes: {},
        customAudience: [],
        displayName: '', 
        displayNameError: false,
        emailShown: false,
        isAudienceOpen: false,
        postAudience: Constants.POST_AUDIENCES.CONNECTIONS,
        mediaVolume: 50,
        settingsPageAlertCollapse: null
    });

    const [settingsPageAlertMessage, setSettingsPageAlertMessage] = useState({type: 'info', message: null});
    const settingsPageAlert = useRef(null);
    

    // Popper
    const [referenceElement, setReferenceElement] = useState(null);
    const [popperElement, setPopperElement] = useState(null);
    const { styles: popperStyles, update: popperUpdate } = usePopper(referenceElement, popperElement, {
        modifiers: [
        ],
        placement: 'bottom'
    });
    const dropdownMenuContainer = useRef();
    
    // render
    useEffect(() => {
        setTitle('Settings');

        return () => {
            debouncedUpdateVolumePreference.cancel();
        }
    }, []);

    // settingsPageAlert.current
    useEffect(() => {
        let settingsPageAlertEl = settingsPageAlert.current;

        if (settingsPageAlertEl) {
            let settingsPageAlertCollapse = new bootstrap.Collapse(settingsPageAlertEl, {
                toggle: false
            });

            settingsPageAlertEl.addEventListener('hidden.bs.collapse', clearSettingsPageAlert);

            setState(prevState => ({
                ...prevState,
                settingsPageAlertCollapse
            }));
            
            return () => {
                settingsPageAlertEl.removeEventListener('hidden.bs.collapse', clearSettingsPageAlert);
            };
        }
    }, [settingsPageAlert.current]);

    // state.postAudience
    useEffect(() => {
        if (popperUpdate) {
            popperUpdate();
        }
    }, [state.postAudience]);

    // state.isAudienceOpen
    useEffect(() => {
        if (state.isAudienceOpen) {
            document.addEventListener('click', hideAudienceDropdown);

            return function cleanup() {
                document.removeEventListener('click', hideAudienceDropdown);
            }
        }
        else {
            document.removeEventListener('click', hideAudienceDropdown);
        }
    }, [state.isAudienceOpen]);

    // state.audienceChanged
    useEffect(() => {
        if (state.audienceChanged) {
            dispatch(currentUserPreferencesUpdated([
                { name: 'postAudience', value: state.postAudience },
                { name: 'customAudience', value: state.customAudience.join(',') }
            ]));

            setState(prevState => ({
                ...prevState,
                audienceChanged: false
            }));
        }
    }, [state.audienceChanged])

    // state.displayNameError
    useEffect(() => {
        if (state.displayNameError) {
            const timer = setTimeout(() => {
                setState(prevState => ({...prevState, displayNameError: false}))
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [state.displayNameError]);

    // defaultConnectionTypes
    useEffect(() => {
        if (state.connectionTypes && Object.keys(state.connectionTypes).length === 0) {
            setState(prevState => ({
                ...prevState,
                connectionTypes: getConnectionTypeDict()
            }));
        }
    }, [defaultConnectionTypes]);

    // currentUserPreferences
    useEffect(() => {
        if (currentUserPreferences) {
            let stateUpdates = {};

            if (state.postAudience !== currentUserPreferences.postAudience) {
                stateUpdates.postAudience = currentUserPreferences.postAudience;
            }

            if (state.mediaVolume !== currentUserPreferences.mediaVolume) {
                stateUpdates.mediaVolume = currentUserPreferences.mediaVolume;
            }

            // Only update the state if we have to
            // This prevents double updates when we first set the state due to interaction
            // and then an update comes through due to redux updating to the new value
            if (Object.keys(stateUpdates).length > 0) {
                setState(prevState => ({
                    ...prevState,
                    ...stateUpdates
                }));
            }
        }
    }, [currentUserPreferences]);

    const showSettingsPageAlert = () => {
        let { settingsPageAlertCollapse } = state;

        if (settingsPageAlertCollapse) {
            settingsPageAlertCollapse.show();
        }
    };

    const hideSettingsPageAlert = () => {
        let { settingsPageAlertCollapse } = state;

        if (settingsPageAlertCollapse) {
            settingsPageAlertCollapse.hide();
        }
    }

    const clearSettingsPageAlert = () => {
        setSettingsPageAlertMessage({type: 'info', message: null});
    };

    const getConnectionTypeDict = () => {
        if (defaultConnectionTypes) {
            return {...defaultConnectionTypes};
        }
        
        return {};
    };

    const hideAudienceDropdown = (event) => {
        if (!dropdownMenuContainer.current.contains(event.target)) {
            setState(prevState => ({
                ...prevState,
                isAudienceOpen: false
            }));
        }       
    };

    const handleAudienceClick = (e) => {
        if (!state.isAudienceOpen) {
            popperUpdate(); // This fixes the position of the dropdown menu
        }

        setState(prevState => ({
            ...prevState,
            isAudienceOpen: !prevState.isAudienceOpen /* Toggle whether it's open */
        }));

        e.stopPropagation();
    };

    const handleCustomChange = (event) => {
        let { name, checked } = event.target;

        let stateUpdates = {
            audienceChanged: false,
            postAudience: state.postAudience, // Default to previous value
            connectionTypes: {
                [name]: checked // Update the connection type that was checked or unchecked
            },
            customAudience: state.customAudience // Default to previous value
        };

        // If the connection type was checked
        if (checked) {
            // If this type wasn't already checked
            if (!state.customAudience.find(connectionType => connectionType === name)) {
                // Set the postAudience to custom
                stateUpdates.postAudience = Constants.POST_AUDIENCES.CUSTOM;

                // Add the type to the custom audience array
                stateUpdates.customAudience = [
                    ...state.customAudience,
                    name
                ];

                stateUpdates.audienceChanged = true;
            }
        }
        // Otherwise, if it was unchecked
        else {
            // Find its index in the custom audience array
            let foundIndex = state.customAudience.findIndex(connectionType => connectionType === name);

            // If found
            if (foundIndex >= 0) {
                // Remove the connection type from the custom audience array 
                let customAudience = newArrayWithItemRemoved(state.customAudience, foundIndex);

                stateUpdates.audienceChanged = true;
                // If there are no more connection types selected, change the post audience back to connections
                stateUpdates.postAudience = customAudience.length === 0 ? Constants.POST_AUDIENCES.CONNECTIONS : Constants.POST_AUDIENCES.CUSTOM;
                stateUpdates.customAudience = customAudience;
            }
        }

        // Update the state with all updates
        setState(prevState => ({
            ...prevState,
            audienceChanged: stateUpdates.audienceChanged,
            connectionTypes: {
                ...prevState.connectionTypes,
                ...stateUpdates.connectionTypes
            },
            customAudience: stateUpdates.customAudience,
            postAudience: stateUpdates.postAudience
        }));

        event.stopPropagation();
    };

    const handleLogoutFromEverywhereClick = async () => {
        await AuthService.logout(true, true);
        let logoutConfirm = bootstrap.Modal.getInstance(document.getElementById('logoutConfirm'));
        logoutConfirm.hide();
        setLoginDetails(null);
        setStatusMessage({type: 'info', message: 'You have been logged out from everywhere'});
        history.push('/login');
    };

    const handleLogoutFromEverywhereElseClick = async () => {
        await AuthService.logout(false, true);

        let logoutConfirm = bootstrap.Modal.getInstance(document.getElementById('logoutConfirm'));
        logoutConfirm.hide();

        setSettingsPageAlertMessage({type: 'info', message: 'You have successfully logged out of all other sessions.'});
        showSettingsPageAlert();
    };

    const handleDeleteAccountClick = (e) => {
        setMessageBoxOptions({
            isOpen: true,
            messageBoxProps: {
                actions: MESSAGE_BOX_TYPES.NO_YES,
                caption: 'Delete Account Confirmation',
                message: 'Are you sure you want to delete your account?',
                onConfirm: () => { confirmDeleteAccountAgain() },
                onDeny: () => {},
                onCancel: undefined,
                subtext: 'You will not be able to undo this action.'
            }
        });
    };

    const confirmDeleteAccountAgain = () => {
        setMessageBoxOptions({
            isOpen: true,
            messageBoxProps: {
                actions: MESSAGE_BOX_TYPES.YES_NO,
                caption: 'Delete Account Confirmation',
                message: <>Are you <em><strong>absolutely sure</strong></em> you want to delete your account?</>,
                onConfirm: () => { actuallyDeleteAccount(); },
                onDeny: () => {},
                onCancel: undefined,
                subtext: <>Everything will be deleted and you <em><strong>will not</strong></em> be able to get it back.</>
            }
        });
    };

    const actuallyDeleteAccount = async () => {
        let success = await UserService.deleteAccount();

        if (success) {
            AuthService.logout(true, true);
            setLoginDetails(null);
            dispatch(reduxLogout());
            setStatusMessage({type: 'info', message: 'Thanks for using the website!'});
            history.push('/login');
        }
        else {
            setSettingsPageAlertMessage({type: 'danger', message: `So, this is embarrassing, but there was an error deleting your account. Please contact support.`});
            showSettingsPageAlert();
        }
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

                setSettingsPageAlertMessage({type: alertType, message: results.data.message});
                showSettingsPageAlert();
            }

            if (results.data.success) {
                dispatch(currentUserDisplayNameUpdated({displayName: state.displayName, displayNameIndex: results.data.displayNameIndex}));
            }
        }, () => {});
    };

    const updateVolumePreference = (value) => {
        dispatch(currentUserPreferencesUpdated([{ name: 'mediaVolume', value }]));
    };

    const debouncedUpdateVolumePreference = useMemo(
        () => debounce(updateVolumePreference, 500)
    , []);

    const handleMediaVolumeChange = (e, newValue) => {
        setState(prevState => ({
            ...prevState,
            mediaVolume: newValue
        }));

        debouncedUpdateVolumePreference(newValue);
    }

    const handleStringPreferenceSelectChange = (e) => {
        const { name, value } = e.target.dataset;

        dispatch(currentUserPreferencesUpdated([{ name, value }]));
    };

    const handleNumberPreferenceSelectChange = (e) => {
        const { name, value: stringValue } = e.target.dataset;

        let value = Number(stringValue);

        if (isNaN(value)) {
            value = 0;
        }
        
        dispatch(currentUserPreferencesUpdated([{ name, value }]));
    };

    const handleSelectEveryoneAudience = () => {
        if (state.postAudience !== Constants.POST_AUDIENCES.EVERYONE) {
            setState(prevState => ({
                ...prevState,
                audienceChanged: true,
                customAudience: [],
                connectionTypes: getConnectionTypeDict(), /* This will reset everything to false */
                isAudienceOpen: false,
                postAudience: Constants.POST_AUDIENCES.EVERYONE
            }));
        }
    };

    const handleSelectConnectionsAudience = () => {
        if (state.postAudience !== Constants.POST_AUDIENCES.CONNECTIONS) {
            setState(prevState => ({
                ...prevState,
                audienceChanged: true,
                customAudience: [],
                connectionTypes: getConnectionTypeDict(), /* This will reset everything to false */
                isAudienceOpen: false,
                postAudience: Constants.POST_AUDIENCES.CONNECTIONS
            }));
        }
    };

    const handleZeroVolumeClick = (e) => {
        setState(prevState => ({
            ...prevState,
            mediaVolume: 0
        }));

        updateVolumePreference(0);
    };

    const handleMaxVolumeClick = (e) => {
        setState(prevState => ({
            ...prevState,
            mediaVolume: 100
        }));

        updateVolumePreference(100);
    };

    return (
        <>
            <div id="settingsPageAlert" ref={settingsPageAlert} className={`alert alert-${settingsPageAlertMessage.type.toLocaleLowerCase()} alert-dismissible collapse w-100`} role="alert">
                <strong>{settingsPageAlertMessage.message}</strong>
                <button type="button" className="btn-close" aria-label="Close" data-bs-target="#settingsPageAlert" data-bs-toggle="collapse" aria-expanded="false" aria-controls="settingsPageAlert"></button>
            </div>
            <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xxl-4 mt-2 align-middle text-center">
                <Card className="mb-2">
                    <CardHeader title="General" />
                    <Divider variant="middle" />
                    <CardContent>
                        <Typography className="card-text" style={{ whitespace: 'pre' }}>
                            Email Address: {
                                state.emailShown
                                ? currentUserEmail
                                : <span style={{ color: 'rgb(11,94,215)', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => { if (!state.emailShown) { setState(prevState => ({...prevState, emailShown: true})); } }}>{ isMobile ? 'Tap' : 'Click' } to show</span>
                            }
                        </Typography>
                        <Typography className="card-text">
                            Profile Name: /{currentUserProfileName}
                        </Typography>
                        <Typography className="card-text">
                            Display Name: {currentUserDisplayName}{
                                currentUserDisplayNameIndex === 0 ? '' : <small className="text-muted">#{currentUserDisplayNameIndex}</small>
                            }
                        </Typography>
                    </CardContent>
                    <Divider variant="middle" />
                    <CardContent>
                        <Typography>
                            <button type="button" className="btn btn-link" data-bs-toggle="modal" data-bs-target="#displayNameForm">Change Display Name</button>
                        </Typography>
                    </CardContent>
                </Card>
                <Card className="mb-2">
                    <CardHeader title="Preferences" />
                    <Divider variant="middle" />
                    <CardContent>
                        <MuiList component="div">
                            <MuiListItem component="div" divider style={{flexWrap: 'wrap'}}>
                                <MuiListItemText primary="Start Page"
                                    secondary="The page you will see when you first log in or need to be redirected to a new page for some reason."
                                    style={{width: '100%'}}
                                />
                                <div className="dropdown">
                                    <button className="btn btn-outline-primary dropdown-toggle" type="button" id="startPageDropdown" data-bs-toggle="dropdown" aria-expanded="false" style={{textTransform: 'capitalize'}}>
                                        {currentUserPreferences?.startPage || 'feed'}
                                    </button>
                                    <ul className="dropdown-menu" aria-labelledby="startPageDropdown">
                                        <li><button className="dropdown-item" data-name="startPage" data-value="profile" type="button" onClick={handleStringPreferenceSelectChange}>Profile</button></li>
                                        <li><button className="dropdown-item" data-name="startPage" data-value="feed" type="button" onClick={handleStringPreferenceSelectChange}>Feed</button></li>
                                    </ul>
                                </div>
                            </MuiListItem>
                            <MuiListItem component="div" divider style={{flexWrap: 'wrap'}}>
                                <MuiListItemText 
                                    id="preferences-show-my-posts-in-feed"
                                    primary="Show My Posts in My Feed"
                                    secondary="When turned on, your own posts will show up in your feed. This is off by default so you only see posts from people you are following. You can see all of your posts on your profile."
                                    style={{width: '100%'}}
                                />
                                <PrimarySwitch
                                    edge="start"
                                    name="showMyPostsInFeed"
                                    className={classes.preferenceInput}
                                    onChange={(e) => {
                                        dispatch(currentUserPreferencesUpdated([{
                                            name: e.target.name, 
                                            value: e.target.checked 
                                        }]))
                                    }}
                                    checked={currentUserPreferences?.showMyPostsInFeed === undefined ? false : currentUserPreferences?.showMyPostsInFeed}
                                    inputProps={{ 'aria-labelledby': 'preferences-show-my-posts-in-feed' }}
                                />
                            </MuiListItem>
                            <MuiListItem component="div" divider style={{flexWrap: 'wrap'}}>
                                <MuiListItemText primary="Default Post Type"
                                    secondary="The default type (Text, Image, etc.) for new posts."
                                    style={{width: '100%'}}
                                />
                                <div className="dropdown">
                                    <button className="btn btn-outline-primary dropdown-toggle" type="button" id="postTypeDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                                        {currentUserPreferences?.postType === undefined ? Constants.POST_TYPES_NAMES[0] : Constants.POST_TYPES_NAMES[currentUserPreferences.postType]}
                                    </button>
                                    <ul className="dropdown-menu" aria-labelledby="postTypeDropdown">
                                        <li><button className="dropdown-item" data-name="postType" data-value="3" type="button" onClick={handleNumberPreferenceSelectChange}>Audio</button></li>
                                        <li><button className="dropdown-item" data-name="postType" data-value="1" type="button" onClick={handleNumberPreferenceSelectChange}>Image</button></li>
                                        <li><button className="dropdown-item" data-name="postType" data-value="0" type="button" onClick={handleNumberPreferenceSelectChange}>Text</button></li>
                                        <li><button className="dropdown-item" data-name="postType" data-value="2" type="button" onClick={handleNumberPreferenceSelectChange}>Video</button></li>
                                    </ul>
                                </div>
                            </MuiListItem>
                            <MuiListItem component="div" divider style={{flexWrap: 'wrap'}}>
                                <MuiListItemText primary="Default Post Audience"
                                    secondary="The default audience (Connections, Everyone, etc.) for new posts."
                                    style={{width: '100%'}}
                                />
                                <div ref={dropdownMenuContainer} className="dropdown">
                                    <button ref={setReferenceElement} 
                                        className={classNames("btn btn-outline-primary dropdown-toggle", {'show': state.isAudienceOpen})}
                                        type="button" 
                                        onClick={handleAudienceClick}
                                    >
                                        {Constants.POST_AUDIENCES_NAMES[state.postAudience]}
                                    </button>
                                    <ul ref={setPopperElement} 
                                        className={classNames('dropdown-menu', 'px-2', {'show': state.isAudienceOpen})}
                                        style={popperStyles.popper}
                                        {...popperStyles.popper}
                                    >
                                        <li className="dropdown-header">Generic</li>
                                        <li><button className="dropdown-item" type="button" onClick={handleSelectEveryoneAudience}>Everyone</button></li>
                                        <li><button className="dropdown-item" type="button" onClick={handleSelectConnectionsAudience}>Outgoing Connections</button></li>
                                        <li><hr className="dropdown-divider" /></li>
                                        <li className="dropdown-header">Custom</li>
                                        {
                                            state.connectionTypes && 
                                            Object.entries(state.connectionTypes).map(([connectionType, details]) => (
                                                <SwitchCheckbox key={connectionType} label={connectionType} isChecked={details} onSwitchChanged={handleCustomChange} useListItem />
                                            ))
                                        }
                                    </ul>
                                </div>
                            </MuiListItem>
                            <MuiListItem component="div" divider style={{flexWrap: 'wrap'}}>
                                <MuiListItemText primary="Default Feed Filter"
                                    secondary="When you visit your feed, the page will come up with this filter applied."
                                    style={{width: '100%'}}
                                />
                                <div className="dropdown">
                                    <button className="btn btn-outline-primary dropdown-toggle" type="button" id="feedFilterDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                                        {currentUserPreferences?.feedFilter === undefined ? `${Constants.POST_TYPES_NAMES[0]} Posts` : `${Constants.POST_TYPES_NAMES[currentUserPreferences.feedFilter]} Posts`}
                                    </button>
                                    <ul className="dropdown-menu" aria-labelledby="feedFilterDropdown">
                                        <li><button className="dropdown-item" data-name="feedFilter" data-value="1000" type="button" onClick={handleNumberPreferenceSelectChange}>All Posts</button></li>
                                        <li><hr className="dropdown-divider" /></li>
                                        <li><button className="dropdown-item" data-name="feedFilter" data-value="3" type="button" onClick={handleNumberPreferenceSelectChange}>Audio Posts</button></li>
                                        <li><button className="dropdown-item" data-name="feedFilter" data-value="1" type="button" onClick={handleNumberPreferenceSelectChange}>Image Posts</button></li>
                                        <li><button className="dropdown-item" data-name="feedFilter" data-value="0" type="button" onClick={handleNumberPreferenceSelectChange}>Text Posts</button></li>
                                        <li><button className="dropdown-item" data-name="feedFilter" data-value="2" type="button" onClick={handleNumberPreferenceSelectChange}>Video Posts</button></li>
                                    </ul>
                                </div>
                            </MuiListItem>
                            <MuiListItem component="div" divider style={{flexWrap: 'wrap'}}>
                                <MuiListItemText 
                                    id="preferences-media-volume"
                                    primary="Default Media Volume"
                                    secondary={<span>When viewing an audio/video post, this is what the volume will default to before the media is played. <em>May not work on mobile.</em></span>}
                                    style={{width: '100%'}}
                                />
                                <MuiGrid container spacing={2} style={{width: '75%'}}>
                                    <MuiGrid item>
                                        <VolumeDownRoundedIcon style={{cursor: 'pointer' }} onClick={handleZeroVolumeClick} />
                                    </MuiGrid>
                                    <MuiGrid item xs>
                                        <PrimarySlider value={state.mediaVolume} onChange={handleMediaVolumeChange} aria-labelledby="preferences-media-volume" />
                                    </MuiGrid>
                                    <MuiGrid item>
                                        <VolumeUpRoundedIcon style={{cursor: 'pointer' }} onClick={handleMaxVolumeClick} />
                                    </MuiGrid>
                                </MuiGrid>
                            </MuiListItem>
                            <MuiListItem component="div" style={{flexWrap: 'wrap'}}>
                                <MuiListItemText 
                                    id="preferences-allow-public-access"
                                    primary="Allow Public Access"
                                    secondary={<span>When turned on, your profile and all posts with an audience of 'Everyone' will be visible to anybody, <em>even if they are not logged in</em>.</span>}
                                    style={{width: '100%'}}
                                />
                                <DangerSwitch
                                    edge="start"
                                    name="showMyPostsInFeed"
                                    className={classes.preferenceInput}
                                    onChange={(e) => {
                                        dispatch(currentUserAllowPublicAccessUpdated(e.target.checked))
                                    }}
                                    checked={currentUserAllowPublicAccess === undefined ? false : currentUserAllowPublicAccess}
                                    inputProps={{ 'aria-labelledby': 'preferences-allow-public-access' }}
                                />
                            </MuiListItem>
                        </MuiList>
                    </CardContent>
                </Card>
                <Card className="mb-2">
                    <CardHeader title="Security" />
                    <Divider variant="middle" />
                    <CardContent>
                        <Typography>
                            <button type="button" className="btn btn-link" data-bs-toggle="modal" data-bs-target="#logoutConfirm">Log out other sessions</button>
                        </Typography>
                        <Typography>
                            <button type="button" className="btn btn-link text-danger" onClick={handleDeleteAccountClick}>Delete Account</button>
                        </Typography>
                    </CardContent>
                </Card>
            </div>
            <div id="logoutConfirm" className="modal fade" tabIndex="-1" data-backdrop="static" data-bs-keyboard="false" aria-labelledby="logoutConfirmLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="logoutConfirmLabel">Log Out Choices</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="close"></button>
                        </div>
                        <div className="modal-body">
                            <p>You can log out from everywhere (including here) or everywhere else (excluding here), which would you like to do?</p>
                            <small>If you only want to log out from here, please use the normal menu option.</small>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-primary" onClick={handleLogoutFromEverywhereClick}>Everywhere</button>
                            <button type="button" className="btn btn-primary" onClick={handleLogoutFromEverywhereElseClick}>Everywhere Else</button>
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
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
                                <button type="button" className="btn-close" data-bs-dismiss="modal" arial-label="close"></button>
                            </div>
                            <div className="modal-body">
                                <p>Please enter your new display name. It will be followed by a unique id number unless your account is verified.</p>
                                <HtmlTooltip title={
                                        <>
                                            <b>Requirements</b>
                                            <ul>
                                                <li>Cannot contain '#' (pound/hash)</li>
                                                <li>Does not have to be unique</li>
                                                <li>Can only be changed {Constants.DISPLAY_NAME_CHANGE_DAYS === 1 ? 'once a day' : `every ${Constants.DISPLAY_NAME_CHANGE_DAYS} days`}</li>
                                            </ul>
                                        </>
                                    }
                                    placement="bottom-start"
                                    enterDelay={500}
                                    disableHoverListener
                                    fontWeight='normal'
                                >
                                    <input type="text" id="displayName" className="form-control" placeholder="Display Name" aria-label="Display name input" value={state.displayName} onChange={handleStateChange} />
                                </HtmlTooltip>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-primary" onClick={handleDisplayNameFormSubmitClick}>Submit</button>
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
