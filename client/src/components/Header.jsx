// https://medium.com/technoetics/create-basic-login-forms-using-react-js-hooks-and-bootstrap-2ae36c15e551
import React from 'react';
import { withRouter, Link } from 'react-router-dom';
import AuthService from '../services/auth.service';
import { reduxLogout } from '../redux/rootReducer';

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUserRoles } from '../redux/users/currentUserSlice';

function Header(props) {
    const dispatch = useDispatch();
    const currentRoles = useSelector(selectCurrentUserRoles);
    const capitalize = (s) => {
        if (typeof s !== 'string') {
            return '';
        }

        return s.charAt(0).toUpperCase() + s.slice(1);
    };

    const collapseNavbarMenu = () => {
        let headerNavbarToggleMenu = document.getElementById('headerNavbarToggleMenu');
        let bootstrapCollapse = new bootstrap.Collapse(headerNavbarToggleMenu, {
            toggle: false
        });
        bootstrapCollapse.hide();
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
        console.log(reduxLogout());
        dispatch(reduxLogout());
    };

    /* TODO: Default this better. This does not handle if they come in without a path, ex: http://localhost:3000/ */
    const title = capitalize(props.location.pathname.substring(1, props.location.pathname.length) || 'Welcome!');
    const loginDetailsExists = props.loginDetails !== null;

    return (
        /*  bg-dark sets the background color of the navbar to the dark theme (dark) color
            navbar-dark sets the foreground color of the navbar to the dark theme (light) color
            container-fluid is required for padding, fluid makes it take up the full width */
        /* <></> is short for React.Fragment, which will eliminate a TypeScript warning about a parent element being necessary */
        <nav className="navbar fixed-top bg-dark navbar-dark">
            <div className="container-fluid">
                <a className="navbar-brand" href="#">{props.title || title}</a>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#headerNavbarToggleMenu" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
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