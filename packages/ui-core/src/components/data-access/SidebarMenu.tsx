import React from 'react';
import { Menu } from 'semantic-ui-react';

const SidebarMenu: React.FC = () => {
    return (
        <Menu.Menu>
            <Menu.Header>Data Access</Menu.Header>
            <Menu.Item>
                Users
            </Menu.Item>
        </Menu.Menu>
    );
};

export default SidebarMenu;
