import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { Button, Icon } from 'semantic-ui-react';

const StyledLink = styled(Link)`
    box-shadow: none;
`;

const LogoutLink: React.FC = () => {
    return (
        <Button basic as={StyledLink} to="/logout">
            <Icon name="sign out" />
            Logout
        </Button>
    );
};

export default LogoutLink;
