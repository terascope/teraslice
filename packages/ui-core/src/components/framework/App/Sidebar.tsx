import React from 'react';
import PropTypes from 'prop-types';
import { Menu, Icon } from 'semantic-ui-react';
import { SidebarItem, useCoreContext } from '../../core';

type Props = {
    sidebarOpen?: boolean;
    menus: React.FunctionComponent[];
};

const Sidebar: React.FC<Props> = ({ menus, sidebarOpen }) => {
    const { authenticated } = useCoreContext();

    return (
        <Menu.Menu
            variant="permanent"
            open={sidebarOpen}
        >
            <Menu.Menu>
                <SidebarItem link="/" label="Home" icon={<Icon name="home" />} />
            </Menu.Menu>
            {authenticated && menus.map((Menu: React.FunctionComponent, i) => ([
                <Menu key={`menu-${i}`} />
            ]))}
        </Menu.Menu>
    );
};

Sidebar.propTypes = {
    sidebarOpen: PropTypes.bool,
    menus: PropTypes.arrayOf(PropTypes.func.isRequired).isRequired,
};

export default Sidebar;
