import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Segment, Icon, Menu, Dropdown, Button } from 'semantic-ui-react';
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
        <Segment position="fixed">
            <Menu.Item onClick={toggleSidebar}>
                <Icon name={openSidebarIconName} />
            </Menu.Item>
            <Menu.Header>
                Teraserver
            </Menu.Header>
            {authenticated && (
                <Dropdown position="right">
                    <Button icon>
                        <Icon name="sign out">
                    </Icon>
                    </Button>
                    <Dropdown.Menu>
                        <Dropdown.Item as={LogoutLink}>
                            Logout
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            )}
        </Segment>
    );
};

Navbar.propTypes = {
    sidebarOpen: PropTypes.bool,
    toggleSidebar: PropTypes.func.isRequired,
};

export default Navbar;
