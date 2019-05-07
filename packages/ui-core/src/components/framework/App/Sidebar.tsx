import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Menu, Icon } from 'semantic-ui-react';
import { useCoreContext } from '../../core';

type Props = {
    sidebarOpen?: boolean;
};

const Sidebar: React.FC<Props> = () => {
    const { authenticated, plugins } = useCoreContext();

    return (
        <Menu vertical fluid>
            <Menu.Item>
                <Link to="/">Home</Link>
                <Icon name="home" />
            </Menu.Item>
            {authenticated && plugins.map((plugin, pi) => {
                return (
                    <Menu.Item key={`plugin-menu-${pi}`} header fitted>
                        <div style={{ padding: '0.7rem' }}>{plugin.name}</div>
                        {plugin.routes.map((route, ri) => {
                            const link = formatPath(plugin.basepath, route.path);
                            return (
                                <Menu.Item key={`plugin-menu-${pi}-route-${ri}`}>
                                    <Link to={link}>{route.name}</Link>
                                    <Icon name={route.icon as any} />
                                </Menu.Item>
                            );
                        })}
                    </Menu.Item>
                );
            })}
        </Menu>
    );
};

function formatPath(basepath?: string, path?: string) {
    return `${trimSlashes(basepath)}/${trimSlashes(path)}`;
}

function trimSlashes(str?: string) {
    let path = str;
    if (!path) return '';
    path = path.replace(/^\//, '');
    path = path.replace(/\/$/, '');
    return path;
}

Sidebar.propTypes = {
    sidebarOpen: PropTypes.bool,
};

export default Sidebar;
