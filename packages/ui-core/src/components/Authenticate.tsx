import React from 'react';
import { AuthUserQuery } from '@terascope/ui-components';

const Authenticate: React.FC = ({ children }) => <AuthUserQuery>{children}</AuthUserQuery>;

export default Authenticate;
