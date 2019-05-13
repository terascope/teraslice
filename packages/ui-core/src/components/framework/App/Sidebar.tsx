import React, { useState } from 'react';
import { History } from 'history';
import { Menu } from 'semantic-ui-react';
import { withRouter } from 'react-router-dom';
import { useCoreContext, PluginConfig, formatPath } from '../../core';
import * as s from './styled';

const SidebarMenuIcon: React.FC<any> = ({ icon, color, open }) => {
    const props = {
        name: icon as any,
        color: color as any,
    };

    if (open) return <s.SidebarOpenedIcon {...props} />;

    return <s.SidebarClosedIcon {...props} />;
};

const SidebarToggleIcon: React.FC<{ open: boolean }> = ({ open }) => {
    return (
        <SidebarMenuIcon
            icon={`chevron ${!open ? 'right' : 'left'}`}
            color="grey"
            open={open}
        />
    );
};

const makePluginLinks = (plugins: PluginConfig[], history: History, open: boolean) => {
    const links: any[] = [];
    plugins.forEach((plugin, pi) => {
        if (open && plugin.name) {
            links.push(<Menu.Item key={`plugin-${pi}`}>{plugin.name}</Menu.Item>);
        }
        plugin.routes.forEach((route, ri) => {
            if (route.hidden) return;
            links.push(
                <s.SidebarMenuItem
                    key={`plugin-${pi}-route-${ri}`}
                    name={route.name}
                    icon={!open}
                    onClick={() => {
                        const path = formatPath(plugin.basepath, route.path);
                        history.push(path);
                    }}
                >
                    <SidebarMenuIcon icon={route.icon} open={open} />
                    {open && <s.SidebarItemName>{route.name}</s.SidebarItemName>}
                </s.SidebarMenuItem>
            );
        });
    });

    return links;
};

const Sidebar: React.FC<any> = ({ history }) => {
    const { authenticated, plugins } = useCoreContext();
    const [open, setState] = useState(false);

    if (!authenticated) return <div />;

    return (
        <s.SidebarMenu open={open} vertical>
            <s.SidebarToggle onClick={() => setState(!open)}>
                <SidebarToggleIcon open={open} />
            </s.SidebarToggle>
            {makePluginLinks(plugins, history, open)}
        </s.SidebarMenu>
    );
};

export default withRouter(Sidebar);
