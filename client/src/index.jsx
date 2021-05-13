import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';
import store from './redux/store';
import { Provider } from 'react-redux';
import { SocketContext, socket } from './contexts/socket';
import './styles/styles.css';
import 'react-image-lightbox/style.css'; // This only needs to be imported once in your app

ReactDOM.render(
    <Provider store={store}>
        <SocketContext.Provider value={socket}>
            <App />
        </SocketContext.Provider>
    </Provider>, 
    document.getElementById('root')
);