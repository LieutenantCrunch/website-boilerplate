import React from 'react';

export default function Header() {
    return (
        /*  navbar-expand-sm causes the navigation bar to expand when on small devices only
            bg-dark sets the background color of the navbar to the dark theme (dark) color
            navbar-dark sets the foreground color of the navbar to the dark theme (light) color
            container-fluid is required for grid system, fluid makes it take up the full width */
        /*  row specifies that this is a grid row
            d-flex makes it a flex container
            justify-content-center centers the content */
        /*  col-1 means that the column will take up all 12 column slots
            text-white means what you'd expect */
        /* h3 makes the text <h3> styled */
        <nav className="navbar navbar-expand-sm bg-dark navbar-dark container-fluid">
            <div className="row d-flex justify-content-center">
                <div className="col-1 text-white">
                    <span className="h3">Register</span>
                </div>
            </div>
        </nav>
    )
};