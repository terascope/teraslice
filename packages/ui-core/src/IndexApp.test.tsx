import React from 'react';
import ReactDOM from 'react-dom';
import IndexApp from './IndexApp';

it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<IndexApp />, div);
    ReactDOM.unmountComponentAtNode(div);
});
