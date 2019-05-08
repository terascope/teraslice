import React from 'react';
import { Icon, Menu, Dropdown } from 'semantic-ui-react';
import { useCoreContext } from '../../core';
import LogoutLink from './LogoutLink';
import styled from 'styled-components';

const TitleMenuItem = styled(Menu.Item)`
    display: flex;
    flex: 1 !important;
    font-size: 1.2rem;
`;

const NavbarMenu = styled(Menu)`
    min-height: 4rem !important;
`;

const DropdownIcon = styled(Icon)`
    font-size: 1.6rem !important;
    margin-right: 0 !important;
`;

const Navbar: React.FC = () => {
    const { authenticated } = useCoreContext();
    const AccountIcon = <DropdownIcon name="user circle" />;

    return (
        <NavbarMenu>
            <TitleMenuItem header>
                Teraserver
            </TitleMenuItem>
            {authenticated && (
                <Dropdown item icon={AccountIcon} className="right">
                    <Dropdown.Menu>
                        <Dropdown.Item as={LogoutLink} />
                    </Dropdown.Menu>
                </Dropdown>
            )}
        </NavbarMenu>
    );
};

export default Navbar;
