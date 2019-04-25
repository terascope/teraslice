import React from 'react';
import { Route } from 'react-router-dom';
import Users from './Users';

const DataAccess: React.FC = () => {
    return (
        <Route path="/users/" component={Users} />
    );
};

export default DataAccess;
