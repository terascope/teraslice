import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'semantic-ui-react';

const LogoutLink: React.FC = ({ children }) => {
    return (
        <Button as={Link} to="/logout">{children}</Button>
    );
};

export default LogoutLink;
