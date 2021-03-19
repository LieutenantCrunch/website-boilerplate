// https://medium.com/technoetics/create-basic-login-forms-using-react-js-hooks-and-bootstrap-2ae36c15e551
import React from 'react';
import { withRouter, Link } from 'react-router-dom';
import AuthService from '../services/auth.service';
import UserService from '../services/user.service';

function Header(props) {
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
        props.setUserInfo(null);
    };

    /* TODO: Default this better. This does not handle if they come in without a path, ex: http://localhost:3000/ */
    const title = capitalize(props.location.pathname.substring(1, props.location.pathname.length) || 'Welcome!');
    const userInfoExists = props.userInfo !== null;

    return (
        /*  bg-dark sets the background color of the navbar to the dark theme (dark) color
            navbar-dark sets the foreground color of the navbar to the dark theme (light) color
            container-fluid is required for padding, fluid makes it take up the full width */
        /* <></> is short for React.Fragment, which will eliminate a TypeScript warning about a parent element being necessary */
        <nav className="navbar fixed-top bg-dark navbar-dark">
            <div className="container-fluid">
                <a className="navbar-brand" href="#">{props.title || title}</a>
                <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#headerNavbarToggleMenu" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="headerNavbarToggleMenu">
                    <ul className="navbar-nav mr-auto mt-2">
                        {
                            userInfoExists 
                            ? <>
                                {
                                    UserService.checkForRole(props.userDetails, 'Administrator')
                                    ? <li className="nav-item">
                                        <a className="nav-link text-right" href="/admin" onClick={handleMenuClickAdmin}>Admin</a>
                                    </li>
                                    : <></>
                                }
                                <li className="nav-item">
                                    <Link className="nav-link text-right" to={'/feed'} onClick={handleMenuClickFeed}>Feed</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link text-right" to={'/profile'} onClick={handleMenuClickProfile}>Profile</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link text-right" to={'/'} onClick={handleMenuClickHome}>Home</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link text-right" to={'/settings'} onClick={handleMenuClickSettings}>Settings</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link text-right" to={'/login'} onClick={handleMenuClickLogout}>Logout</Link>
                                </li>
                            </>
                            : <>
                                <li className="nav-item">
                                    <Link className="nav-link text-right" to={'/login'} onClick={handleMenuClickLogin}>Login</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link text-right" to={'/'} onClick={handleMenuClickHome}>Home</Link>
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