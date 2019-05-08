import React from 'react';
import { Dropdown } from 'semantic-ui-react';
import { useCoreContext } from '../../core';
import LogoutLink from './LogoutLink';
import * as s from './styled';

const Navbar: React.FC = () => {
    const { authenticated } = useCoreContext();
    const AccountIcon = <s.DropdownIcon name="user circle" />;

    return (
        <s.NavbarMenu>
            <s.TitleMenuItem header>
                Teraserver
            </s.TitleMenuItem>
            {authenticated && (
                <Dropdown item icon={AccountIcon} className="right">
                    <Dropdown.Menu>
                        <Dropdown.Item as={LogoutLink} />
                    </Dropdown.Menu>
                </Dropdown>
            )}
        </s.NavbarMenu>
    );
};

export default Navbar;
