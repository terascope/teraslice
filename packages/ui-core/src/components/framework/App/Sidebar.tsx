import React, { useState } from 'react';
import { History } from 'history';
import styled from 'styled-components';
import { withRouter } from 'react-router-dom';
import { Menu, Icon } from 'semantic-ui-react';
import { formatPath } from '../../../helpers';
import {
    useCoreContext,
    PluginConfig,
} from '../../core';

const SidebarIcon = styled(Icon)`
    font-size: 1.6em !important;
`;

const FullIcon = styled(SidebarIcon)`
    padding-right: 2.1rem;
`;

const MinimalIcon = styled(SidebarIcon)`
    padding-right: 0;
`;

const SidebarToggle = styled.a`
    display: flex !important;
    flex-direction: column;
    align-items: flex-end;
    min-height: 3.9rem !important;
    justify-content: center;
`;

const SidebarMenu = styled(Menu)`
    ${props => props.open ? '' : 'width: 4rem !important;'};
    display: flex !important;
    flex-flow: column nowrap;
    justify-content: flex-start;
`;

const ItemName = styled.div`
    padding-top: 0.3rem;
    font-weight: 600;
`;

const MenuItem = styled(Menu.Item)`
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-between;
`;

const SidebarMenuIcon: React.FC<any> = ({ icon, color, open }) => {
    const props = {
        name: icon as any,
        color: color as any,
    };

    if (open) {
        return <FullIcon {...props} />;
    }
    return <MinimalIcon {...props} />;
};

const makePluginLinks = (plugins: PluginConfig[], history: History, open: boolean) => {
    const links: any[] = [];
    plugins.forEach((plugin, pi) => {
        if (open && plugin.name) {
            links.push((
                <Menu.Item key={`plugin-${pi}`}>
                    {plugin.name}
                </Menu.Item>
            ));
        }
        plugin.routes.forEach((route, ri) => {
            if (route.hidden) return;
            links.push(
                <MenuItem
                    key={`route-${ri}`}
                    name={route.name}
                    icon={!open}
                    onClick={() => {
                        const path = formatPath(plugin.basepath, route.path);
                        history.push(path);
                    }}
                >
                    <SidebarMenuIcon icon={route.icon} open={open} />
                    {open && (
                        <ItemName>{route.name}</ItemName>
                    )}
                </MenuItem>
            );
        });
    });

    return links;
};
const Sidebar: React.FC<any> = ({ history }) => {
    const { authenticated, plugins } = useCoreContext();

    const [open, setState] = useState(false);
    const toggleSidebar = () => setState(!open);

    const toggleSidebarIcon = !open ? 'right' : 'left';

    return (
        <SidebarMenu open={open} vertical>
            <Menu.Item as={SidebarToggle} onClick={toggleSidebar}>
                <SidebarMenuIcon icon={`chevron ${toggleSidebarIcon}`} color="grey" open={open} />
            </Menu.Item>
            <MenuItem
                icon={!open}
                onClick={() => history.push('/')}
            >
                <SidebarMenuIcon icon="home" open={open} />
                {open && <ItemName>Home</ItemName>}
            </MenuItem>
            {authenticated && makePluginLinks(plugins, history, open)}
        </SidebarMenu>
    );
};

export default  withRouter(Sidebar);
