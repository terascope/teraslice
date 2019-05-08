import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Menu, Icon } from 'semantic-ui-react';
import { formatPath } from '../../../helpers';
import { useCoreContext } from '../../core';

const SidebarLink = styled(Link)`
    color: rgba(0, 0, 0, 0.87);
    font-size: 1.1em;
`;

const SidebarIcon = styled(Icon)`
    color: #4183C4;
    font-size: 1.2em;
`;

const FullIcon = styled(SidebarIcon)`
    padding-right: 2.1rem;
`;

const MinimalIcon = styled(SidebarIcon)`
    padding-right: 0;
`;

const SidebarMenuIcon: React.FC<any> = ({ icon, color, open }) => {
    const props = {
        name: icon as any,
        color: color as any,
        fitted: true,
        size: 'large'
    };

    if (open) {
        return <FullIcon {...props} />;
    }
    return <MinimalIcon {...props} />;
};

const PluginHeader = styled(Menu.Header)`
    padding: 0.8rem 0.5rem !important;
    margin-bottom: 0 !important;
`;

const SidebarToggle = styled.a`
    display: flex !important;
    flex-direction: column;
    align-items: flex-end;
`;

const SidebarMenu = styled(Menu)`
    ${props => props.open ? '' : 'width: 4rem !important;'};
`;

const Sidebar: React.FC = () => {
    const { authenticated, plugins } = useCoreContext();

    const [open, setState] = useState(false);
    const toggleSidebar = () => setState(!open);

    const toggleSidebarIcon = !open ? 'right' : 'left';

    return (
        <SidebarMenu open={open} vertical>
            <Menu.Item as={SidebarToggle} onClick={toggleSidebar}>
                <SidebarMenuIcon icon={`chevron ${toggleSidebarIcon}`} color="grey" open={open} />
            </Menu.Item>
            <Menu.Item>
                <SidebarLink to="/">
                    <SidebarMenuIcon icon="home" open={open} />
                    {open && 'Home'}
                </SidebarLink>
            </Menu.Item>
            {authenticated && plugins.map((plugin, pi) => (
                <Menu.Item key={`plugin-menu-${pi}`} header fitted>
                    {open && (
                        <PluginHeader className="ui small grey">
                            {plugin.name}
                        </PluginHeader>
                    )}
                    {plugin.routes.map((route, ri) => (
                        <Menu.Item key={`plugin-menu-${pi}-route-${ri}`}>
                            <SidebarLink to={formatPath(plugin.basepath, route.path)}>
                                <SidebarMenuIcon icon={route.icon} open={open} />
                                {open && route.name}
                            </SidebarLink>
                        </Menu.Item>
                    ))}
                </Menu.Item>
            ))}
        </SidebarMenu>
    );
};

export default Sidebar;
