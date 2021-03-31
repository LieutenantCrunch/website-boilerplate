import React from 'react';
import ReactDOM from 'react-dom';
import store from './redux/store';
import { Provider } from 'react-redux';
import './styles/styles.css';
import AdminPage from './components/AdminPage';

ReactDOM.render(
    <Provider store={store}>
        <AdminPage />
    </Provider>, 
    document.getElementById('root')
);