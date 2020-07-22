// https://medium.com/technoetics/create-basic-login-forms-using-react-js-hooks-and-bootstrap-2ae36c15e551
import React from 'react';
import { withRouter, Link } from 'react-router-dom';
import AuthService from '../services/auth.service';

function Header(props) {
    const capitalize = (s) => {
        if (typeof s !== 'string') {
            return '';
        }

        return s.charAt(0).toUpperCase() + s.slice(1);
    };

    const handleLogout = () => {
        props.setUserInfo(null);
    };

    /* TODO: Default this better. This does not handle if they come in without a path, ex: http://localhost:3000/ */
    const title = capitalize(props.location.pathname.substring(1, props.location.pathname.length) || 'Welcome!');
    const userInfoExists = props.userInfo !== null;

    return (
        /*  bg-dark sets the background color of the navbar to the dark theme (dark) color
            navbar-dark sets the foreground color of the navbar to the dark theme (light) color
            container-fluid is required for padding, fluid makes it take up the full width */
        <nav className="navbar fixed-top bg-dark navbar-dark">
            <div className="container-fluid">
                <a className="navbar-brand" href="#">{props.title || title}</a>
                <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#headerNavbarToggleMenu" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="headerNavbarToggleMenu">
                    <ul className="navbar-nav mr-auto mt-2">
                        <li className="nav-item">
                            {
                                userInfoExists 
                                ? <Link className="nav-link text-right" to={'/login'} onClick={handleLogout}>Logout</Link>
                                : <Link className="nav-link text-right" to={'/login'}>Login</Link>
                            }
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    )
};

export default withRouter(Header);