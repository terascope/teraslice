import React from 'react';
import { Menu } from 'semantic-ui-react';
import { SidebarItem } from '../core';

const SidebarMenu: React.FC = () => {
    return (
       <Menu.Item header fitted>
            <div style={{ padding: '0.7rem' }}>Data Access</div>
            <SidebarItem link="/users" label="Users" icon="users" />
       </Menu.Item>
    );
};

export default SidebarMenu;
