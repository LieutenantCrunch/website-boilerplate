import React from 'react';
import ReactDOM from 'react-dom';
import AdminPage from './components/AdminPage';
import store from './redux/store';
import { Provider } from 'react-redux';
import { StyledEngineProvider } from '@material-ui/core/styles';
import './styles/styles.css';
import 'react-image-lightbox/style.css'; // This only needs to be imported once in your app

ReactDOM.render(
    <Provider store={store}>
        <StyledEngineProvider injectFirst>
            <AdminPage />
        </StyledEngineProvider>
    </Provider>, 
    document.getElementById('root')
);