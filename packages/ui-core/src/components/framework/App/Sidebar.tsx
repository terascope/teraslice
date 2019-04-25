import React from 'react';
import PropTypes from 'prop-types';
import List from '@material-ui/core/List';
import Drawer from '@material-ui/core/Drawer';
import HomeIcon from '@material-ui/icons/Home';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import { CoreProps, corePropTypes } from '../../../helpers';
import { SidebarItem } from '../../core';
import withStyles from './styles';

type Props = CoreProps & {
    authenticated?: boolean;
    sideBarOpen?: boolean;
    handleSidebarClose?: () => void;
    menus: React.FunctionComponent[];
};

class Sidebar extends React.Component<Props> {
    static propTypes = {
        ...corePropTypes,
        authenticated: PropTypes.bool.isRequired,
        sideBarOpen: PropTypes.bool,
        handleSidebarClose: PropTypes.func.isRequired,
        menus: PropTypes.arrayOf(PropTypes.func.isRequired).isRequired,
    };

    render() {
        const {
            authenticated,
            menus,
            classes,
            sideBarOpen,
            handleSidebarClose,
        } = this.props;

        return (
            <Drawer
                className={classes.drawer}
                variant="persistent"
                anchor="left"
                open={sideBarOpen}
                classes={{
                    paper: classes.drawerPaper,
                }}
            >
                <div className={classes.drawerHeader}>
                    <IconButton onClick={handleSidebarClose}>
                    {sideBarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                    </IconButton>
                </div>
                <Divider />
                <List>
                    <SidebarItem link="/" label="Home" icon={<HomeIcon />} />
                </List>
                {authenticated && menus.map((Menu: React.FunctionComponent) => ([
                    <Divider />,
                    <Menu />
                ]))}
            </Drawer>
        );
    }
}

export default withStyles(Sidebar);
