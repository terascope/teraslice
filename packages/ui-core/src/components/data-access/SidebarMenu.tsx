import React from 'react';
import List from '@material-ui/core/List';
import PeopleIcon from '@material-ui/icons/People';
import { SidebarItem } from '../core';

const SidebarMenu: React.FC = () => {
    return (
       <List>
            <SidebarItem link="/users" label="Users" icon={<PeopleIcon />} />
       </List>
    );
};

export default SidebarMenu;
