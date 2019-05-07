import React from 'react';
import PropTypes from 'prop-types';
import { Menu } from 'semantic-ui-react';
import { SidebarItem, useCoreContext } from '../../core';

type Props = {
    sidebarOpen?: boolean;
    menus: React.FunctionComponent[];
};

const Sidebar: React.FC<Props> = ({ menus }) => {
    const { authenticated } = useCoreContext();

    return (
        <Menu vertical fluid>
            <SidebarItem link="/" label="Home" icon="home" />
            {authenticated && menus.map((MenuGroup: React.FunctionComponent, i) => (
                <MenuGroup key={`menu-${i}`} />
            ))}
        </Menu>
    );
};

Sidebar.propTypes = {
    sidebarOpen: PropTypes.bool,
    menus: PropTypes.arrayOf(PropTypes.func.isRequired).isRequired,
};

export default Sidebar;
