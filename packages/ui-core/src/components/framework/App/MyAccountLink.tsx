import React from 'react';
import { Button, Icon } from 'semantic-ui-react';
import { BasicLink } from './styled';
import { useCoreContext } from '../../core';

const MyAccountLink: React.FC = () => {
    const authUser = useCoreContext().authUser!;

    return (
        <Button basic as={BasicLink} to={`/users/edit/${authUser.id}`}>
            <Icon name="user circle outline" />
            My Account
        </Button>
    );
};

export default MyAccountLink;
