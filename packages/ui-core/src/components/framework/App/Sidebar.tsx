import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import { Menu, Icon } from 'semantic-ui-react';
import { formatPath } from '../../../helpers';
import { useCoreContext } from '../../core';

type Props = {
    sidebarOpen: boolean;
};

const SidebarMenuIcon: React.FC<{ icon: string, sidebarOpen: boolean }> = ({ icon, sidebarOpen }) => {
    return <Icon
        name={icon as any}
        className={classNames({
            sidebarMenuIcon: !!sidebarOpen,
            minimalSidebarIcon: !sidebarOpen
        })}
    />;
};

const Sidebar: React.FC<Props> = ({ sidebarOpen }) => {
    const { authenticated, plugins } = useCoreContext();

    return (
        <Menu vertical className={classNames({
            minimalSidebar: !sidebarOpen
        })}>
            <Menu.Item>
                <Link to="/">
                    <SidebarMenuIcon icon="home" sidebarOpen={sidebarOpen} />
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
                                <SidebarMenuIcon icon={route.icon} sidebarOpen={sidebarOpen} />
                                {sidebarOpen && route.name}
                            </Link>
                        </Menu.Item>
                    ))}
                </Menu.Item>
            ))}
        </Menu>
    );
};

Sidebar.propTypes = {
    sidebarOpen: PropTypes.bool.isRequired,
};

export default Sidebar;
