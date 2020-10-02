import React, {useState, useRef} from 'react';
import AdminHeader from './AdminHeader';
import {BrowserRouter as Router} from 'react-router-dom';
import UserService from '../services/user.service';
import UserSearch from './UserSearch';

export default function AdminPage() {
    const [title, setTitle] = useState('Admin Panel');
    const [state, setState] = useState({
        loading: false,
        userSearchPage: 0,
        userSearchTotal: 0
    });

    return (
        <div>
            <Router>
                <AdminHeader  title={title} />
                <div className="container-fluid d-flex align-items-center flex-column">
                    <UserSearch className="w-25" />
                </div>
            </Router>
        </div>
    );
}