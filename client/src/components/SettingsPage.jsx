import React, {useEffect, useState, useRef} from 'react';
import {withRouter} from 'react-router-dom';
import AuthService from '../services/auth.service';
import UserService from '../services/user.service';
import { HtmlTooltip } from './HtmlTooltip';
import * as Constants from '../constants/constants';

// Material UI
import { makeStyles, withStyles } from '@material-ui/core/styles';
import Divider from '@material-ui/core/Divider';
import MuiList from '@material-ui/core/List';
import MuiListItem from '@material-ui/core/ListItem';
import MuiListItemText from '@material-ui/core/ListItemText';
import MuiSwitch from '@material-ui/core/Switch';
import NativeSelect from '@material-ui/core/NativeSelect';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

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

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { currentUserAllowPublicAccessUpdated, currentUserDisplayNameUpdated, currentUserPreferenceUpdated, selectCurrentUserAllowPublicAccess, selectCurrentUserPreferences } from '../redux/users/currentUserSlice';

const useStyles = makeStyles(() => ({
    preferenceHeader: {
        padding: '.5em 0',
    },
    preferenceInput: {
        marginLeft: '.25em'
    }
}));

function SettingsPage(props) {
    const dispatch = useDispatch();
    const currentUserAllowPublicAccess = useSelector(selectCurrentUserAllowPublicAccess);
    const currentUserPreferences = useSelector(selectCurrentUserPreferences);

    const classes = useStyles();

    const [settingsPageAlert, setSettingsPageAlert] = useState({type: 'info', message: null});
    const settingsPageAlertEl = useRef(null);
    const [state, setState] = useState({displayName: '', displayNameError: false});
    
    useEffect(() => {
        props.setTitle('Settings');
    }, []);

    useEffect(() => {
        if (state.displayNameError) {
            const timer = setTimeout(() => {
                setState(prevState => ({...prevState, displayNameError: false}))
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [state.displayNameError]);

    const handleLogoutFromEverywhereClick = async () => {
        await AuthService.logout(true, true);
        let logoutConfirm = bootstrap.Modal.getInstance(document.getElementById('logoutConfirm'));
        logoutConfirm.hide();
        props.setLoginDetails(null);
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
                dispatch(currentUserDisplayNameUpdated({displayName: state.displayName, displayNameIndex: results.data.displayNameIndex}));
            }
        }, () => {});
    };

    const handlePreferenceSelectChange = (e) => {
        const { name, value } = e.target;

        dispatch(currentUserPreferenceUpdated({ name, value }));
    };

    const clearSettingsPageAlert = () => {
        setSettingsPageAlert({type: 'info', message: null});
    };

    return (
        <>
            <div id="settingsPageAlertEl" ref={settingsPageAlertEl} className={`alert alert-${settingsPageAlert.type.toLocaleLowerCase()} alert-dismissible collapse w-100`} role="alert">
                <strong>{settingsPageAlert.message}</strong>
                <button type="button" className="btn-close" aria-label="Close" data-bs-target="#settingsPageAlertEl" data-bs-toggle="collapse" aria-expanded="false" aria-controls="settingsPageAlert"></button>
            </div>
            <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xxl-4 mt-2 align-middle text-center">
                <Paper className="mb-2">
                    <Typography variant="h5" className={classes.preferenceHeader}>General</Typography>
                    <button type="button" className="btn btn-link" data-bs-toggle="modal" data-bs-target="#displayNameForm">Change Display Name</button>
                </Paper>
                <Paper className="mb-2">
                    <Typography variant="h5" className={classes.preferenceHeader}>Security</Typography>
                    <button type="button" className="btn btn-link" data-bs-toggle="modal" data-bs-target="#logoutConfirm">Log out other sessions</button>
                </Paper>
                <Paper className="mb-2">
                    <Typography variant="h5" className={classes.preferenceHeader}>Preferences</Typography>
                    <Divider variant="middle" />
                    <MuiList component="div">
                        <MuiListItem component="div" divider style={{flexWrap: 'wrap'}}>
                            <MuiListItemText primary="Start Page"
                                secondary="The page you will see when you first log in or need to be redirected to a new page for some reason."
                                style={{width: '100%'}}
                            />
                            <NativeSelect
                                value={currentUserPreferences?.startPage || 'profile'}
                                inputProps={{name: 'startPage'}}
                                className={classes.preferenceInput}
                                onChange={handlePreferenceSelectChange}
                            >
                                <option value="profile">Profile</option>
                                <option value="feed">Feed</option>
                            </NativeSelect>
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
                                    dispatch(currentUserPreferenceUpdated({
                                        name: e.target.name, 
                                        value: e.target.checked 
                                    }))
                                }}
                                checked={currentUserPreferences?.showMyPostsInFeed || false}
                                inputProps={{ 'aria-labelledby': 'preferences-show-my-posts-in-feed' }}
                            />
                        </MuiListItem>
                        <MuiListItem component="div" divider style={{flexWrap: 'wrap'}}>
                            <MuiListItemText primary="Default Post Type"
                                secondary="The default type (Text, Image, etc.) for new posts."
                                style={{width: '100%'}}
                            />
                            <NativeSelect
                                value={currentUserPreferences?.postType || 0}
                                inputProps={{name: 'postType'}}
                                className={classes.preferenceInput}
                                onChange={handlePreferenceSelectChange}
                            >
                                <option value="0">Text</option>
                                <option value="1">Image</option>
                                <option value="2">Audio</option>
                                <option value="3">Video</option>
                            </NativeSelect>
                        </MuiListItem>
                        <MuiListItem component="div" divider style={{flexWrap: 'wrap'}}>
                            <MuiListItemText primary="Default Post Audience"
                                secondary="The default audience (Connections, Everyone, etc.) for new posts."
                                style={{width: '100%'}}
                            />
                            <NativeSelect
                                value={currentUserPreferences?.postAudience || 0}
                                inputProps={{name: 'postAudience'}}
                                className={classes.preferenceInput}
                                onChange={handlePreferenceSelectChange}
                            >
                                <option value="0">Connections</option>
                                <option value="1">Everyone</option>
                                <option value="2" disabled>Custom</option>
                            </NativeSelect>
                        </MuiListItem>
                        <MuiListItem component="div" divider style={{flexWrap: 'wrap'}}>
                            <MuiListItemText primary="Default Feed Filter"
                                secondary="When you visit your feed, the page will come up with this filter applied."
                                style={{width: '100%'}}
                            />
                            <NativeSelect
                                value={currentUserPreferences?.feedFilter || 1000}
                                inputProps={{name: 'feedFilter'}}
                                className={classes.preferenceInput}
                                onChange={handlePreferenceSelectChange}
                            >
                                <option value="0">Text</option>
                                <option value="1">Image</option>
                                <option value="2">Audio</option>
                                <option value="3">Video</option>
                                <option value="1000">All</option>
                            </NativeSelect>
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
                                checked={currentUserAllowPublicAccess}
                                inputProps={{ 'aria-labelledby': 'preferences-allow-public-access' }}
                            />
                        </MuiListItem>
                    </MuiList>
                </Paper>
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

export default withRouter(SettingsPage);