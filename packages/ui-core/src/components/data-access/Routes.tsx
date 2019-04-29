import React from 'react';
import { Route } from 'react-router-dom';
import Users from './Users';

const Routes: React.FC = () => {
    return (
        <Route path="/users/" component={Users} />
    );
};

export default Routes;
