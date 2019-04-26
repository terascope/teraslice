import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import List from '@material-ui/core/List';
import Drawer from '@material-ui/core/Drawer';
import HomeIcon from '@material-ui/icons/Home';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import { CoreProps, corePropTypes } from '../../../helpers';
import { SidebarItem, CoreContext } from '../../core';

type Props = CoreProps & {
    sideBarOpen?: boolean;
    handleSidebarClose?: () => void;
    menus: React.FunctionComponent[];
    theme: any;
};

class Sidebar extends React.Component<Props> {
    static propTypes = {
        ...corePropTypes,
        theme: PropTypes.any.isRequired,
        sideBarOpen: PropTypes.bool,
        handleSidebarClose: PropTypes.func.isRequired,
        menus: PropTypes.arrayOf(PropTypes.func.isRequired).isRequired,
    };

    static contextType = CoreContext;

    render() {
        const {
            menus,
            classes,
            sideBarOpen,
            handleSidebarClose,
            theme,
        } = this.props;

        const { authenticated } = this.context;

        return (
            <Drawer
                variant="permanent"
                open={sideBarOpen}
                className={classNames(classes.drawer, {
                    [classes.drawerOpen]: sideBarOpen,
                    [classes.drawerClose]: !sideBarOpen,
                })}
                classes={{
                    paper: classNames({
                        [classes.drawerOpen]: sideBarOpen,
                        [classes.drawerClose]: !sideBarOpen,
                    }),
                }}
            >
                <div className={classes.toolbar}>
                    <IconButton onClick={handleSidebarClose}>
                         {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                    </IconButton>
                </div>
                <Divider />
                <List>
                    <SidebarItem link="/" label="Home" icon={<HomeIcon />} />
                </List>
                {authenticated && menus.map((Menu: React.FunctionComponent, i) => ([
                    <Divider key={`divider-${i}`} />,
                    <Menu key={`menu-${i}`} />
                ]))}
            </Drawer>
        );
    }
}

export default Sidebar;
