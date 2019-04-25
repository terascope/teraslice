import React from 'react';
import PropTypes from 'prop-types';
import { Menu, Sidebar } from 'semantic-ui-react';

type Props = {
    authenticated?: boolean;
    visible?: boolean;
    onHide?: () => void;
};

const SidebarMenu: React.FC<Props> = (props) => {
    if (!props.authenticated) return <div></div>;

    const { children, visible, onHide } = props;
    return (
        <Sidebar
            width="thin"
            animation="push"
            onHide={onHide}
            visible={visible}
            onItemClick={(event: any, data: any) => { console.log({ event, data }); }}
        >
            <Menu.Menu>
                <Menu.Header>--</Menu.Header>
                <Menu.Item>Home</Menu.Item>
            </Menu.Menu>
            {children}
        </Sidebar>
    );
};

SidebarMenu.propTypes = {
    authenticated: PropTypes.bool.isRequired,
    visible: PropTypes.bool,
    onHide: PropTypes.func,
};

export default SidebarMenu;
