// https://medium.com/technoetics/create-basic-login-forms-using-react-js-hooks-and-bootstrap-2ae36c15e551
import React, { useContext, useRef } from 'react';
import { withRouter, Link } from 'react-router-dom';
import AuthService from '../services/auth.service';
import { reduxLogout } from '../redux/rootReducer';
import { capitalizeString } from '../utilities/TextUtilities';
import * as Constants from '../constants/constants';

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { addCommentNotification, selectAllCommentNotifications } from '../redux/notifications/commentsSlice';
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
    const dispatch = useDispatch();
    const currentRoles = useSelector(selectCurrentUserRoles);
    const commentNotifications = useSelector(selectAllCommentNotifications);

    const socket = useContext(SocketContext);

    socket.on(Constants.SOCKET_EVENTS.NOTIFY_USER.NEW_COMMENT, (commentNotification) => {
        console.log(`Post ID ${commentNotification.postId}: '${commentNotification.message}'`);
        dispatch(addCommentNotification(commentNotification));
    });

    const collapseNotificationMenu = () => {
        let headerNavbarToggleMenu = document.getElementById('headerNavbarToggleNotifications');
        let bootstrapCollapse = new bootstrap.Collapse(headerNavbarToggleMenu, {
            toggle: false
        });
        bootstrapCollapse.hide();
    };

    const collapseNavbarMenu = () => {
        let headerNavbarToggleMenu = document.getElementById('headerNavbarToggleMenu');
        let bootstrapCollapse = new bootstrap.Collapse(headerNavbarToggleMenu, {
            toggle: false
        });
        bootstrapCollapse.hide();
    };

    const handleNotificationClick = () => {
        collapseNavbarMenu();
    };

    const handleMenuClick = () => {
        collapseNotificationMenu();
    };

    const handleMenuClickAdmin = () => {
        collapseNavbarMenu();
    };

    const handleMenuClickLogin = () => {
        collapseNavbarMenu();
    };

    const handleMenuClickHome = () => {
        collapseNavbarMenu();
    };

    const handleMenuClickFeed = () => {
        collapseNavbarMenu();
    };

    const handleMenuClickProfile = () => {
        collapseNavbarMenu();
    };

    const handleMenuClickSettings = () => {
        collapseNavbarMenu();
    };

    const handleMenuClickLogout = () => {
        collapseNavbarMenu();
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
                        <button className="navbar-toggler mx-1" type="button" data-bs-toggle="collapse" data-bs-target="#headerNavbarToggleNotifications" aria-expanded="false" aria-label="Toggle notifications" onClick={handleNotificationClick}>
                            <StyledBadge badgeContent={commentNotifications?.length || 0} max={99} invisible={!commentNotifications || commentNotifications.length === 0}>
                                <NotificationsOutlinedIcon style={{color: 'rgba(255,255,255,0.55)', fontSize: '1.5em'}} />
                            </StyledBadge>
                        </button>
                    }
                    <button className="navbar-toggler ms-1" type="button" data-bs-toggle="collapse" data-bs-target="#headerNavbarToggleMenu" aria-expanded="false" aria-label="Toggle navigation" onClick={handleMenuClick}>
                        <span className="navbar-toggler-icon"></span>
                    </button>
                </div>
                <div className="collapse navbar-collapse" id ="headerNavbarToggleNotifications">
                    <ul className="navbar-nav mr-auto mt-2">
                        {
                            commentNotifications && commentNotifications.length > 0
                            ? commentNotifications.map(commentNotification => (
                                <li key={commentNotification.commentId} className="nav-item">
                                    <a className="nav-link text-end" href="#">{commentNotification.message}</a>
                                </li>
                            ))
                            : <li className="nav-item" key="None">
                                <a className="nav-link text-end" href="#">None</a>
                            </li>
                        }
                    </ul>
                </div>
                <div className="collapse navbar-collapse" id="headerNavbarToggleMenu">
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