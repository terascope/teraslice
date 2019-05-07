import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Icon, Menu, Dropdown } from 'semantic-ui-react';
import { useCoreContext } from '../../core';
import LogoutLink from './LogoutLink';

type Props = {
    sidebarOpen?: boolean;
    toggleSidebar: () => void;
};

const Navbar: React.FC<Props> = ({ sidebarOpen, toggleSidebar }) => {
    const { authenticated } = useCoreContext();

    const openSidebarIconName: any = classNames('chevron', {
        right: sidebarOpen,
        left: !sidebarOpen,
    });

    return (
        <Menu>
            <Menu.Item onClick={toggleSidebar}>
                <Icon name={openSidebarIconName} />
            </Menu.Item>
            <Menu.Item header>
                Teraserver
            </Menu.Item>
            {authenticated && (
                <Dropdown item icon="user circle" className="right">
                    <Dropdown.Menu>
                        <Dropdown.Item as={LogoutLink} />
                    </Dropdown.Menu>
                </Dropdown>
            )}
        </Menu>
    );
};

Navbar.propTypes = {
    sidebarOpen: PropTypes.bool,
    toggleSidebar: PropTypes.func.isRequired,
};

export default Navbar;
