import React from 'react';
import { AuthUserQuery } from '../core';

const Authenticate: React.FC = ({ children }) => {
    return (
        <AuthUserQuery>{children}</AuthUserQuery>
    );
};

export default Authenticate;
