import React, { useState } from 'react';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import { Menu, Icon } from 'semantic-ui-react';
import { formatPath } from '../../../helpers';
import { useCoreContext } from '../../core';

const Sidebar: React.FC = () => {
    const { authenticated, plugins } = useCoreContext();

    const [sidebarOpen, setState] = useState(false);
    const toggleSidebar = () => setState(!sidebarOpen);

    const toggleSidebarIcon = !sidebarOpen ? 'right' : 'left';

    const SidebarMenuIcon: React.FC<{ icon: string, color?: string }> = ({ icon, color }) => {
        return <Icon
            name={icon as any}
            color={color as any}
            fitted
            size="large"
            className={classNames({
                sidebarMenuIcon: !!sidebarOpen,
                minimalSidebarIcon: !sidebarOpen
            })}
        />;
    };

    return (
        <Menu vertical className={classNames({
            minimalSidebar: !sidebarOpen
        })}>
            <Menu.Item as="a" onClick={toggleSidebar} className="sidebarToggle">
                <SidebarMenuIcon icon={`chevron ${toggleSidebarIcon}`} color="grey" />
            </Menu.Item>
            <Menu.Item>
                <Link to="/">
                    <SidebarMenuIcon icon="home" />
                    {sidebarOpen && 'Home'}
                </Link>
            </Menu.Item>
            {authenticated && plugins.map((plugin, pi) => (
                <Menu.Item key={`plugin-menu-${pi}`} header fitted>
                    {sidebarOpen && (
                        <Menu.Header className="ui small grey sidebarPluginHeader">
                            {plugin.name}
                        </Menu.Header>
                    )}
                    {plugin.routes.map((route, ri) => (
                        <Menu.Item key={`plugin-menu-${pi}-route-${ri}`}>
                            <Link to={formatPath(plugin.basepath, route.path)}>
                                <SidebarMenuIcon icon={route.icon} />
                                {sidebarOpen && route.name}
                            </Link>
                        </Menu.Item>
                    ))}
                </Menu.Item>
            ))}
        </Menu>
    );
};

export default Sidebar;
