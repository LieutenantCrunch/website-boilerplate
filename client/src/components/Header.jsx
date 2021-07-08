// https://medium.com/technoetics/create-basic-login-forms-using-react-js-hooks-and-bootstrap-2ae36c15e551
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AuthService from '../services/auth.service';
import { reduxLogout } from '../redux/rootReducer';
import { capitalizeString } from '../utilities/TextUtilities';

// Other Components
import { PostNotification } from './PostNotification';
import { TwoClickButton } from './FormControls/TwoClickButton';

// Redux
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { fetchPostNotifications, markAllPostNotificationsAsSeen, removeAllPostNotifications, selectAllPostNotificationIds, selectFetchPostNotificationsStatus } from '../redux/notifications/postsSlice';
import { selectCurrentUserRoles, seenPostNotifications, selectHasUnseenPostNotifications } from '../redux/users/currentUserSlice';

// Material UI
import Badge from '@material-ui/core/Badge';
import NotificationsOutlinedIcon from '@material-ui/icons/NotificationsOutlined';
import { makeStyles, withStyles } from '@material-ui/styles';

const PrimaryBadge = withStyles((theme) => ({
    badge: {
        backgroundColor: 'rgb(11,94,215)'
    }
}))(Badge);

const useStyles = makeStyles(() => ({
    notificationsContainer: {
        textAlign: 'right'
    },
    clearButtonSecondClick: {
        borderColor: 'rgb(255,100,100)'
    }
}));

export const Header = ({ headerMiddleEl, loginDetails, setLoginDetails, title }) => {
    const [state, setState] = useState({
        notificationsExpanded: false,
        notificationsCollapse: null,
        navbarExpanded: false,
        navbarCollapse: null
    });

    const classes = useStyles();
    const dispatch = useDispatch();
    const location = useLocation();

    const currentRoles = useSelector(selectCurrentUserRoles);
    const postNotificationIds = useSelector(selectAllPostNotificationIds, shallowEqual);
    const hasUnseenPostNotifications = useSelector(selectHasUnseenPostNotifications);
    const fetchPostNotificationsStatus = useSelector(selectFetchPostNotificationsStatus);

    const headerNavbar = useRef(null);
    const headerNotifications = useRef(null);

    useEffect(() => {
        let headerNotificationsEl = headerNotifications.current;
        let headerNavbarEl = headerNavbar.current;

        if (headerNotificationsEl && headerNavbarEl) {
            let notificationsCollapse = new bootstrap.Collapse(headerNotificationsEl, {
                toggle: false
            });

            let navbarCollapse = new bootstrap.Collapse(headerNavbarEl, {
                toggle: false
            });

            const markNotificationsSeenAfterShown = () => {
                dispatch(markAllPostNotificationsAsSeen());
            };

            headerNotificationsEl.addEventListener('shown.bs.collapse', markNotificationsSeenAfterShown);

            setState(prevState => ({
                ...prevState,
                navbarCollapse,
                notificationsCollapse
            }));

            return () => {
                headerNotificationsEl.removeEventListener('shown.bs.collapse', markNotificationsSeenAfterShown);
            };
        }
    }, [headerNotifications.current, headerNavbar.current]);

    const showNotificationMenu = () => {
        let { notificationsCollapse } = state;

        if (notificationsCollapse) {
            notificationsCollapse.show();
        }

        setState(prevState => ({
            ...prevState,
            notificationsExpanded: true
        }));
    };

    const hideNotificationMenu = () => {
        let { notificationsCollapse } = state;

        if (notificationsCollapse) {
            notificationsCollapse.hide();
        }

        setState(prevState => ({
            ...prevState,
            notificationsExpanded: false
        }));
    };

    const showNavbarMenu = () => {
        let { navbarCollapse } = state;

        if (navbarCollapse) {
            navbarCollapse.show();
        }

        setState(prevState => ({
            ...prevState,
            navbarExpanded: true
        }));
    };

    const hideNavbarMenu = () => {
        let { navbarCollapse } = state;

        if (navbarCollapse) {
            navbarCollapse.hide();
        }

        setState(prevState => ({
            ...prevState,
            navbarExpanded: false
        }));
    };

    const getPostNotificationsList = () => {
        switch (fetchPostNotificationsStatus) {
            case 'loading':
                return <li key="Loading" className="nav-item">
                        <a className="nav-link text-end" href="#">Loading...</a>
                    </li>;
            case 'idle':
                return postNotificationIds && postNotificationIds.length > 0
                    ? postNotificationIds.map(postNotificationId => {
                        return <PostNotification key={postNotificationId} notificationId={postNotificationId} />
                    })
                    : <li key="None" className="nav-item">
                        <a className="nav-link text-end" href="#">None</a>
                    </li>;
            case 'failed':
            default:
                return <li key="Error" className="nav-item">
                        <a className="nav-link text-end" href="#">Error</a>
                    </li>;
        }
    };

    const handleNotificationClick = async (e) => {
        hideNavbarMenu();

        if (state.notificationsExpanded) {
            hideNotificationMenu();
        }
        else {
            showNotificationMenu();

            await dispatch(fetchPostNotifications());

            dispatch(seenPostNotifications());
        }
    };

    const handleMenuClick = (e) => {
        hideNotificationMenu();
        
        if (state.navbarExpanded) {
            hideNavbarMenu();
        }
        else {
            showNavbarMenu();
        }
    };

    const handleMenuClickAdmin = () => {
        hideNavbarMenu();
    };

    const handleMenuClickLogin = () => {
        hideNavbarMenu();
    };

    const handleMenuClickHome = () => {
        hideNavbarMenu();
    };

    const handleMenuClickFeed = () => {
        hideNavbarMenu();
    };

    const handleMenuClickProfile = () => {
        hideNavbarMenu();
    };

    const handleMenuClickSettings = () => {
        hideNavbarMenu();
    };

    const handleMenuClickTerms = () => {
        hideNavbarMenu();
    };

    const handleMenuClickLogout = () => {
        hideNavbarMenu();
        AuthService.logout();
        setLoginDetails(null);
        dispatch(reduxLogout());
    };

    /* TODO: Default this better. This does not handle if they come in without a path, ex: http://localhost:3000/ */
    const locationTitle = capitalizeString(location.pathname.substring(1, location.pathname.length) || 'Welcome!');
    const loginDetailsExists = loginDetails !== null;

    return (
        /*  bg-dark sets the background color of the navbar to the dark theme (dark) color
            navbar-dark sets the foreground color of the navbar to the dark theme (light) color
            container-fluid is required for padding, fluid makes it take up the full width */
        /* <></> is short for React.Fragment, which will eliminate a TypeScript warning about a parent element being necessary */
        <nav className="navbar fixed-top bg-dark navbar-dark">
            <div className="container-fluid">
                <a className="navbar-brand" href="#">{title || locationTitle}</a>
                {
                    headerMiddleEl
                }
                <div>
                    {
                        loginDetailsExists &&
                        <button className="navbar-toggler mx-1" type="button" data-bs-toggle="collapse" aria-expanded="false" aria-label="Toggle notifications" onClick={handleNotificationClick}>
                            <PrimaryBadge variant="dot" invisible={!hasUnseenPostNotifications}>
                                <NotificationsOutlinedIcon style={{color: 'rgba(255,255,255,0.55)', fontSize: '1.5em'}} />
                            </PrimaryBadge>
                        </button>
                    }
                    <button className="navbar-toggler ms-1" type="button" data-bs-toggle="collapse" aria-expanded="false" aria-label="Toggle navigation" onClick={handleMenuClick}>
                        <span className="navbar-toggler-icon"></span>
                    </button>
                </div>
                <div ref={headerNotifications} className={`collapse navbar-collapse ${classes.notificationsContainer}`}>
                    {
                        postNotificationIds && postNotificationIds.length > 0 &&
                        <TwoClickButton 
                            className="btn btn-sm mt-2"     
                            firstClassName="btn-outline-danger" 
                            firstTitle="Clear All" 
                            firstTooltip={`Clear all notifications?`}
                            onClick={(event) => {
                                dispatch(removeAllPostNotifications());
                            }}
                            progressClassName="bg-danger" 
                            resetAfterSecondClick
                            secondClassName={classes.clearButtonSecondClick}
                            secondDuration={5}     
                            secondTitle="Confirm Clear" 
                            secondTooltip={`Confirm you want to clear all notifications`}
                            secondBackgroundColor="rgba(255,200,200,.25)"
                        />
                    }
                    <ul className="navbar-nav mr-auto mt-2">
                        {
                            getPostNotificationsList()
                        }
                    </ul>
                </div>
                <div ref={headerNavbar} className="collapse navbar-collapse">
                    <ul className="navbar-nav mr-auto mt-2">
                        {
                            loginDetailsExists 
                            ? <>
                                {
                                    currentRoles.includes('Administrator')
                                    ? <li className="nav-item">
                                        <a className="nav-link text-end" href="/admin" onClick={handleMenuClickAdmin}>Admin</a>
                                    </li>
                                    : <></>
                                }
                                <li className="nav-item">
                                    <Link className="nav-link text-end" to={'/feed'} onClick={handleMenuClickFeed}>Feed</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link text-end" to={'/profile'} onClick={handleMenuClickProfile}>Profile</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link text-end" to={'/settings'} onClick={handleMenuClickSettings}>Settings</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link text-end" to={'/'} onClick={handleMenuClickHome}>Home</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link text-end" to={'/terms'} onClick={handleMenuClickTerms}>Terms</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link text-end" to={'/login'} onClick={handleMenuClickLogout}>Logout</Link>
                                </li>
                            </>
                            : <>
                                <li className="nav-item">
                                    <Link className="nav-link text-end" to={'/login'} onClick={handleMenuClickLogin}>Login</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link text-end" to={'/'} onClick={handleMenuClickHome}>Home</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link text-end" to={'/terms'} onClick={handleMenuClickTerms}>Terms</Link>
                                </li>
                            </>
                        }
                    </ul>
                </div>
            </div>
        </nav>
    )
};
