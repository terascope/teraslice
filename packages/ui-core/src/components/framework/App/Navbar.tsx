import React from 'react';
import { Dropdown, Button, Icon } from 'semantic-ui-react';
import { useCoreContext } from '../../core';
import * as s from './styled';

type LinkProps = { to: string; iconName: string };
const DropdownLink: React.FC<LinkProps> = ({ to, iconName, children }) => {
    return (
        <Button basic as={s.BasicLink} to={to} fluid>
            <Icon name={iconName as any} />
            {children}
        </Button>
    );
};

const Navbar: React.FC = () => {
    const { authenticated } = useCoreContext();
    const AccountIcon = <s.DropdownIcon name="user circle" />;

    return (
        <s.NavbarMenu>
            <s.TitleMenuItem header>Teraserver</s.TitleMenuItem>
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
        </s.NavbarMenu>
    );
};

export default Navbar;
