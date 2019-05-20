import React from 'react';
import { Link } from 'react-router-dom';
import { Dropdown, Button, Icon, Menu } from 'semantic-ui-react';
import { useCoreContext } from '@terascope/ui-components';

type LinkProps = { to: string; iconName: string };
const DropdownLink: React.FC<LinkProps> = ({ to, iconName, children }) => {
    return (
        <Button basic as={Link} to={to} fluid className="navBarLink">
            <Icon name={iconName as any} />
            {children}
        </Button>
    );
};

const Navbar: React.FC = () => {
    const { authenticated } = useCoreContext();
    const AccountIcon = <Icon name="user circle" className="dropdownIcon" />;

    return (
        <Menu className="navbarMenu">
            <Menu.Item header className="navbarTitle">
                Teraserver
            </Menu.Item>
            {authenticated && (
                <Dropdown item icon={AccountIcon} className="right">
                    <Dropdown.Menu>
                        <Dropdown.Item
                            as={DropdownLink}
                            to={'/users/account'}
                            iconName="user circle"
                        >
                            My Account
                        </Dropdown.Item>
                        <Dropdown.Item
                            as={DropdownLink}
                            to={'/logout'}
                            iconName="sign out"
                        >
                            Logout
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            )}
        </Menu>
    );
};

export default Navbar;
