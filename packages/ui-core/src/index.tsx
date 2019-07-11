import './add-externals';

import React from 'react';
import ReactDOM from 'react-dom';

import 'semantic-ui-css/semantic.min.css';
import '@terascope/ui-components/index.css';
import './index.css';

import IndexApp from './IndexApp';
import * as serviceWorker from './service-worker';

// ensure that the window is loaded to give the plugins
// time to load
window.onload = () => {
    ReactDOM.render(<IndexApp />, document.getElementById('root'));
};

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
