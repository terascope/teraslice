import React from 'react';
import { AuthUserQuery } from '@terascope/ui-components';

const Authenticate: React.FC = ({ children }) => {
    return <AuthUserQuery>{children}</AuthUserQuery>;
};

export default Authenticate;
