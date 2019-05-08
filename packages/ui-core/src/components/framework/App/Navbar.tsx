import React from 'react';
import { Icon, Menu, Dropdown } from 'semantic-ui-react';
import { useCoreContext } from '../../core';
import LogoutLink from './LogoutLink';
import styled from 'styled-components';

const TitleMenuItem = styled(Menu.Item)`
    display: flex;
    flex: 1 !important;
`;

const Navbar: React.FC = () => {
    const { authenticated } = useCoreContext();
    const AccountIcon = <Icon fitted size="large" name="user circle" />;

    return (
        <Menu>
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
        </Menu>
    );
};

export default Navbar;
