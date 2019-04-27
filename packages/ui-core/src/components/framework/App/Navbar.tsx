import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import Menu from '@material-ui/core/Menu';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import MenuIcon from '@material-ui/icons/Menu';
import Toolbar from '@material-ui/core/Toolbar';
import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import AccountCircle from '@material-ui/icons/AccountCircle';
import { CoreProps, corePropTypes } from '../../../helpers';
import { CoreContext } from '../../core';

type Props = CoreProps & {
    sideBarOpen?: boolean;
    toggleSidebar: () => void;
};

type State = {
    anchorEl: any;
};

const LogoutLink: React.FC = ({ children }) => {
    return (
        // @ts-ignore
        <Button component={Link} to="/logout">{children}</Button>
    );
};

class Navbar extends React.Component<Props, State> {
    static propTypes = {
        ...corePropTypes,
        sideBarOpen: PropTypes.bool,
        toggleSidebar: PropTypes.func.isRequired,
    };

    static contextType = CoreContext;

    state: State = {
        anchorEl: null,
    };

    handleToggle = (event: any) => {
        this.setState({ anchorEl: event.currentTarget });
    }

    handleClose = () => {
        this.setState({ anchorEl: null });
    }

    render() {
        const {
            classes,
            sideBarOpen,
            toggleSidebar
        } = this.props;
        const { anchorEl } = this.state;
        const { authenticated } = this.context;

        const rightMenuOpen = Boolean(anchorEl);

        return (
            <AppBar
                position="fixed"
                className={classNames(classes.appBar, {
                    [classes.appBarShift]: sideBarOpen,
                })}
            >
                <Toolbar disableGutters={!sideBarOpen} >
                    <IconButton
                        color="inherit"
                        aria-label="Open drawer"
                        onClick={toggleSidebar}
                        className={classNames(classes.menuButton, {
                            [classes.hide]: sideBarOpen,
                        })}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" color="inherit" noWrap>
                        Teraserver
                    </Typography>
                    {authenticated && (
                        <div className={classes.alignRight}>
                            <IconButton
                                aria-owns={rightMenuOpen ? 'menu-appbar' : undefined}
                                aria-haspopup="true"
                                onClick={this.handleToggle}
                                color="inherit"
                            >
                                <AccountCircle />
                            </IconButton>
                            <Menu
                                id="menu-appbar"
                                anchorEl={anchorEl}
                                getContentAnchorEl={null}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'center',
                                }}
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'center',
                                }}
                                open={rightMenuOpen}
                                onClose={this.handleClose}
                            >
                                <MenuItem component={LogoutLink}>
                                    Logout
                                </MenuItem>
                            </Menu>
                        </div>
                    )}
                </Toolbar>
            </AppBar>
        );
    }
}

export default Navbar;
