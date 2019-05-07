import React from 'react';
import PropTypes from 'prop-types';
import { Icon, Menu, Dropdown } from 'semantic-ui-react';
import { useCoreContext } from '../../core';
import LogoutLink from './LogoutLink';

type Props = {
    sidebarOpen: boolean;
    toggleSidebar: () => void;
};

const Navbar: React.FC<Props> = ({ sidebarOpen, toggleSidebar }) => {
    const { authenticated } = useCoreContext();

    const toggleSidebarIcon = sidebarOpen ? 'right' : 'left';

    return (
        <Menu>
            <Menu.Item as="a" onClick={toggleSidebar}>
                <Icon name={`chevron ${toggleSidebarIcon}` as any} />
            </Menu.Item>
            <Menu.Item header>
                Teraserver
            </Menu.Item>
            {authenticated && (
                <Dropdown item icon={<Icon fitted size="large" name="user circle" />} className="right">
                    <Dropdown.Menu>
                        <Dropdown.Item as={LogoutLink} />
                    </Dropdown.Menu>
                </Dropdown>
            )}
        </Menu>
    );
};

Navbar.propTypes = {
    sidebarOpen: PropTypes.bool.isRequired,
    toggleSidebar: PropTypes.func.isRequired,
};

export default Navbar;
