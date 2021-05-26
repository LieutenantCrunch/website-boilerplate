// https://medium.com/technoetics/create-basic-login-forms-using-react-js-hooks-and-bootstrap-2ae36c15e551
import React, { useContext, useEffect, useRef, useState } from 'react';
import { withRouter, Link } from 'react-router-dom';
import AuthService from '../services/auth.service';
import { reduxLogout } from '../redux/rootReducer';
import { capitalizeString, isNullOrWhiteSpaceOnly } from '../utilities/TextUtilities';
import * as Constants from '../constants/constants';
import { v4 as uuidv4 } from 'uuid';

// Other Components
import { PostNotification } from './PostNotification';

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { selectUnseenPostNotificationCount } from '../redux/rootReducer';
import { addPostNotification, fetchPostNotifications, markAllPostNotificationsAsSeen, removeAllPostNotifications, selectAllPostNotifications, selectFetchPostNotificationsStatus } from '../redux/notifications/postsSlice';
import { selectCurrentUserRoles } from '../redux/users/currentUserSlice';

// Material UI
import Badge from '@material-ui/core/Badge';
import NotificationsOutlinedIcon from '@material-ui/icons/NotificationsOutlined';
import { withStyles } from '@material-ui/core/styles';

// Socket.IO
import { SocketContext } from '../contexts/socket';

const StyledBadge = withStyles((theme) => ({
    badge: {
        backgroundColor: 'rgb(11,94,215)'
    }
}))(Badge);

function Header(props) {
    const [state, setState] = useState({
        notificationsExpanded: false,
        notificationsCollapse: null,
        navbarExpanded: false,
        navbarCollapse: null
    });

    const dispatch = useDispatch();
    const currentRoles = useSelector(selectCurrentUserRoles);
    const postNotifications = useSelector(selectAllPostNotifications);
    const unseenPostNotificationCount = useSelector(selectUnseenPostNotificationCount);
    const fetchPostNotificationsStatus = useSelector(selectFetchPostNotificationsStatus);

    const socket = useContext(SocketContext);

    socket.on(Constants.SOCKET_EVENTS.NOTIFY_USER.NEW_COMMENT, (postNotification) => {
        dispatch(addPostNotification(postNotification));
    });

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
    };

    const hideNotificationMenu = () => {
        let { notificationsCollapse } = state;

        if (notificationsCollapse) {
            notificationsCollapse.hide();
        }
    };

    const showNavbarMenu = () => {
        let { navbarCollapse } = state;

        if (navbarCollapse) {
            navbarCollapse.show();
        }
    };

    const hideNavbarMenu = () => {
        let { navbarCollapse } = state;

        if (navbarCollapse) {
            navbarCollapse.hide();
        }
    };

    const getPostNotificationsList = () => {
        switch (fetchPostNotificationsStatus) {
            case 'loading':
                return <li key="Loading" className="nav-item">
                        <a className="nav-link text-end" href="#">Loading...</a>
                    </li>;
            case 'idle':
                return postNotifications && postNotifications.length > 0
                    ? postNotifications.map(postNotification => {
                        return <PostNotification key={postNotification.uniqueId} notification={postNotification} />
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
            
            setState(prevState => ({
                ...prevState,
                notificationsExpanded: false
            }));
        }
        else {
            let results = await dispatch(fetchPostNotifications());

            showNotificationMenu();

            setState(prevState => ({
                ...prevState,
                navbarExpanded: false,
                notificationsExpanded: true
            }));
        }
    };

    const handleMenuClick = (e) => {
        hideNotificationMenu();
        
        if (state.navbarExpanded) {
            hideNavbarMenu();
            
            setState(prevState => ({
                ...prevState,
                navbarExpanded: false
            }));
        }
        else {
            showNavbarMenu();

            setState(prevState => ({
                ...prevState,
                navbarExpanded: true,
                notificationsExpanded: false
            }));
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

    const handleMenuClickLogout = () => {
        hideNavbarMenu();
        AuthService.logout();
        props.setLoginDetails(null);
        dispatch(reduxLogout());
    };

    /* TODO: Default this better. This does not handle if they come in without a path, ex: http://localhost:3000/ */
    const title = capitalizeString(props.location.pathname.substring(1, props.location.pathname.length) || 'Welcome!');
    const loginDetailsExists = props.loginDetails !== null;

    return (
        /*  bg-dark sets the background color of the navbar to the dark theme (dark) color
            navbar-dark sets the foreground color of the navbar to the dark theme (light) color
            container-fluid is required for padding, fluid makes it take up the full width */
        /* <></> is short for React.Fragment, which will eliminate a TypeScript warning about a parent element being necessary */
        <nav className="navbar fixed-top bg-dark navbar-dark">
            <div className="container-fluid">
                <a className="navbar-brand" href="#">{props.title || title}</a>
                {
                    props.headerMiddleEl
                }
                <div>
                    {
                        loginDetailsExists &&
                        <button className="navbar-toggler mx-1" type="button" data-bs-toggle="collapse" aria-expanded="false" aria-label="Toggle notifications" onClick={handleNotificationClick}>
                            <StyledBadge badgeContent={unseenPostNotificationCount || 0} max={99} invisible={!unseenPostNotificationCount || unseenPostNotificationCount === 0}>
                                <NotificationsOutlinedIcon style={{color: 'rgba(255,255,255,0.55)', fontSize: '1.5em'}} />
                            </StyledBadge>
                        </button>
                    }
                    <button className="navbar-toggler ms-1" type="button" data-bs-toggle="collapse" aria-expanded="false" aria-label="Toggle navigation" onClick={handleMenuClick}>
                        <span className="navbar-toggler-icon"></span>
                    </button>
                </div>
                <div ref={headerNotifications} className="collapse navbar-collapse">
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
                                    <Link className="nav-link text-end" to={'/'} onClick={handleMenuClickHome}>Home</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link text-end" to={'/settings'} onClick={handleMenuClickSettings}>Settings</Link>
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
                            </>
                        }
                    </ul>
                </div>
            </div>
        </nav>
    )
};

export default withRouter(Header);