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
    handleSidebarOpen: () => void;
};

type State = {
    rightMenuOpen: boolean;
};

const LogoutLink: React.FC = ({ children }) => (
    <Link to="/logout">{children}</Link>
);

class Navbar extends React.Component<Props, State> {
    static propTypes = {
        ...corePropTypes,
        sideBarOpen: PropTypes.bool,
        handleSidebarOpen: PropTypes.func.isRequired,
    };

    static contextType = CoreContext;

    state: State = {
        rightMenuOpen: false,
    };

    handleToggle = () => {
        this.setState(state => ({
            rightMenuOpen: !state.rightMenuOpen,
        }));
    }

    handleClose = () => {
        this.setState({ rightMenuOpen: false });
    }

    render() {
        const {
            classes,
            sideBarOpen,
            handleSidebarOpen
        } = this.props;
        const { rightMenuOpen } = this.state;
        const { authenticated } = this.context;

        return (
            <AppBar
                position="fixed"
                className={classNames(classes.appBar, {
                    [classes.appBarShift]: sideBarOpen,
                })}
            >
                <Toolbar disableGutters={!sideBarOpen}>
                    <IconButton
                        color="inherit"
                        aria-label="Open drawer"
                        onClick={handleSidebarOpen}
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
                                anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                open={rightMenuOpen}
                                onClose={this.handleClose}
                            >
                                <MenuItem>
                                    <Button component={LogoutLink}>Logout</Button>
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
