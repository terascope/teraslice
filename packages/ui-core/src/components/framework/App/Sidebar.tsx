import React, { useState } from 'react';
import { History } from 'history';
import { Menu, Icon } from 'semantic-ui-react';
import {
    useCoreContext,
    PluginConfig,
    formatPath,
    tsWithRouter,
    ResolvedUser,
    hasAccessToRoute,
    hasAccessTo,
} from '@terascope/ui-components';

const SidebarMenuIcon = tsWithRouter<any>(({ icon, color, open }) => {
    const props = {
        name: icon as any,
        color: color as any,
    };

    let className = 'sidebarIcon';
    if (open) className += ' sidebarOpenIcon';
    else className += ' sidebarClosedIcon';

    return <Icon className={className} {...props} />;
});

const SidebarToggleIcon: React.FC<{ open: boolean }> = ({ open }) => {
    return (
        <SidebarMenuIcon
            icon={`chevron ${!open ? 'right' : 'left'}`}
            color="grey"
            open={open}
        />
    );
};

const makePluginLinks = (
    plugins: PluginConfig[],
    history: History,
    open: boolean,
    authUser?: ResolvedUser
) => {
    const links: any[] = [];
    plugins.forEach((plugin, pi) => {
        if (open && plugin.name && hasAccessTo(authUser, plugin.access)) {
            links.push(
                <Menu.Item key={`plugin-${pi}`}>{plugin.name}</Menu.Item>
            );
        }
        plugin.routes.forEach((route, ri) => {
            if (route.hidden) return;
            if (!hasAccessToRoute(authUser, { plugin, route })) return;

            links.push(
                <Menu.Item
                    key={`plugin-${pi}-route-${ri}`}
                    name={route.name}
                    icon={!open}
                    className="sidebarMenuItem"
                    onClick={() => {
                        const path = formatPath(plugin.basepath, route.path);
                        history.push(path);
                    }}
                >
                    <SidebarMenuIcon icon={route.icon} open={open} />
                    {open && (
                        <div className="sidebarItemName">{route.name}</div>
                    )}
                </Menu.Item>
            );
        });
    });

    return links;
};

const Sidebar = tsWithRouter<any>(({ history }) => {
    const { authenticated, plugins, authUser } = useCoreContext();
    const [open, setState] = useState(true);

    if (!authenticated) return <div />;

    let className = 'sidebarMenu';
    if (!open) className += ' sidebarMenuClosed';

    return (
        <Menu className={className} open={open} vertical>
            <Menu.Item
                className="sidebarToggle"
                onClick={() => setState(!open)}
            >
                <SidebarToggleIcon open={open} />
            </Menu.Item>
            {makePluginLinks(plugins, history, open, authUser)}
        </Menu>
    );
});

export default Sidebar;
