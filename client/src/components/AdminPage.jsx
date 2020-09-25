import React, {useState} from 'react';
import AdminHeader from './AdminHeader';
import {BrowserRouter as Router} from 'react-router-dom';

export default function AdminPage() {
    const [title, setTitle] = useState('Admin Panel');

    return (
        <div>
            <Router>
                <AdminHeader  title={title} />
                <div className="container-fluid d-flex align-items-center flex-column">
                    This is the admin page
                </div>
            </Router>
        </div>
    );
}