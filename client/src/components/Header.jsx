// https://medium.com/technoetics/create-basic-login-forms-using-react-js-hooks-and-bootstrap-2ae36c15e551
import React from 'react';
import { withRouter } from 'react-router-dom';

function Header(props) {
    const capitalize = (s) => {
        if (typeof s !== 'string') {
            return '';
        }

        return s.charAt(0).toUpperCase() + s.slice(1);
    };

    /* TODO: Default this better. This does not handle if they come in without a path, ex: http://localhost:3000/ */
    const title = capitalize(props.location.pathname.substring(1, props.location.pathname.length));

    return (
        /*  navbar-expand-sm causes the navigation bar to expand when on small devices only
            bg-dark sets the background color of the navbar to the dark theme (dark) color
            navbar-dark sets the foreground color of the navbar to the dark theme (light) color
            container-fluid is required for grid system, fluid makes it take up the full width */
        /*  row specifies that this is a grid row
            d-flex makes it a flex container
            justify-content-center centers the content */
        /*  col-12 means that the column will take up all 12 column slots
            text-center means what you'd expect
            text-white means what you'd expect */
        /* h3 makes the text <h3> styled */
        <nav className="navbar navbar-expand bg-dark navbar-dark container-fluid">
            <div className="row justify-content-center">
                <div className="col-12 text-center text-white">
                    <span className="h3">{props.title || title}</span>
                </div>
            </div>
        </nav>
    )
};

export default withRouter(Header);