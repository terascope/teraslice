import React from 'react';
import PropTypes from 'prop-types';
import CssBaseline from '@material-ui/core/CssBaseline';
import { CoreProps, corePropTypes } from '../../../helpers';
import { CoreContext } from '../../core';
import withStyles from './styles';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';

type Props = CoreProps & {
    menus: React.FunctionComponent[];
};

type State = {
    sidebarOpen: boolean;
};

class App extends React.Component<Props, State> {
    static propTypes =  {
        ...corePropTypes,
        menus: PropTypes.arrayOf(PropTypes.func.isRequired).isRequired,
    };

    static contextType = CoreContext;

    state = {
        sidebarOpen: false,
    };

    toggleSidebar = () => {
        this.setState((state) => ({
            sidebarOpen: !state.sidebarOpen
        }));
    }

    render() {
        const { classes, children, menus } = this.props;
        const { sidebarOpen } = this.state;

        return (
            <div className={classes.root}>
                <CssBaseline />
                <Navbar
                    classes={classes}
                    toggleSidebar={this.toggleSidebar}
                />
                <Sidebar
                    sideBarOpen={sidebarOpen}
                    classes={classes}
                    menus={menus}
                />
                <main className={classes.content}>
                    <div className={classes.toolbar} />
                    <div>{children}</div>
                    <Footer classes={classes} />
                </main>
            </div>
        );
    }
}

export default withStyles(App);
