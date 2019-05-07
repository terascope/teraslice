import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Menu, Icon } from 'semantic-ui-react';
import { formatPath } from '../../../helpers';
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
            {authenticated && plugins.map((plugin, pi) => (
                <Menu.Item key={`plugin-menu-${pi}`} header fitted>
                    <div style={{ padding: '0.7rem' }}>{plugin.name}</div>
                    {plugin.routes.map((route, ri) => (
                        <Menu.Item key={`plugin-menu-${pi}-route-${ri}`}>
                            <Link to={formatPath(plugin.basepath, route.path)}>{route.name}</Link>
                            <Icon name={route.icon as any} />
                        </Menu.Item>
                    ))}
                </Menu.Item>
            ))}
        </Menu>
    );
};

Sidebar.propTypes = {
    sidebarOpen: PropTypes.bool,
};

export default Sidebar;
