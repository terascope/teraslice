import React from 'react';
import { Icon, Menu, Dropdown } from 'semantic-ui-react';
import { useCoreContext } from '../../core';
import LogoutLink from './LogoutLink';

type Props = {
    sidebarOpen: boolean;
    toggleSidebar: () => void;
};

const Navbar: React.FC = () => {
    const { authenticated } = useCoreContext();

    return (
        <Menu>
            <Menu.Item header className="navbarTitle">
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

export default Navbar;
