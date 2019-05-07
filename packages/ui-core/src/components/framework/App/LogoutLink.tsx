import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Icon } from 'semantic-ui-react';

const LogoutLink: React.FC = () => {
    const style = { boxShadow: 'none' };
    return (
        <Button basic as={Link} to="/logout" style={style}>
            <Icon name="sign out" />
            Logout
        </Button>
    );
};

export default LogoutLink;
