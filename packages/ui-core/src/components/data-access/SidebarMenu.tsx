import React from 'react';
import { Menu, Icon } from 'semantic-ui-react';
import { SidebarItem } from '../core';

const SidebarMenu: React.FC = () => {
    return (
       <Menu.Menu>
            <Menu.Header>Data Access</Menu.Header>
            <SidebarItem link="/users" label="Users" icon={<Icon name="users" />} />
       </Menu.Menu>
    );
};

export default SidebarMenu;
