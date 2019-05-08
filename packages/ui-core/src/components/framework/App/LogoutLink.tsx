import React from 'react';
import { Button, Icon } from 'semantic-ui-react';
import { BasicLink } from './styled';

const LogoutLink: React.FC = () => (
    <Button basic as={BasicLink} to="/logout">
        <Icon name="sign out" />
        Logout
    </Button>
);

export default LogoutLink;
