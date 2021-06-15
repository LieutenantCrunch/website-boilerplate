// https://medium.com/technoetics/create-basic-login-forms-using-react-js-hooks-and-bootstrap-2ae36c15e551
import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { capitalizeString } from '../utilities/TextUtilities';

export const AdminHeader = ({ title }) => {
    const history = useHistory();
    const location = useLocation();

    const handleBackClick = () => {
        history.goBack();
    };

    /* TODO: Default this better. This does not handle if they come in without a path, ex: http://localhost:3000/ */
    const locationTitle = capitalizeString(location.pathname.substring(1, location.pathname.length) || 'Admin Panel');

    return (
        /*  bg-dark sets the background color of the navbar to the dark theme (dark) color
            navbar-dark sets the foreground color of the navbar to the dark theme (light) color
            container-fluid is required for padding, fluid makes it take up the full width */
        /* <></> is short for React.Fragment, which will eliminate a TypeScript warning about a parent element being necessary */
        <nav className="navbar fixed-top bg-dark navbar-dark">
            <div className="container-fluid justify-content-between">
                <a className="navbar-brand" href="#">{title || locationTitle}</a>
                <button className="btn btn-outline-light" type="button" aria-label="Previous page" onClick={handleBackClick}>
                    Back
                </button>
            </div>
        </nav>
    )
};
