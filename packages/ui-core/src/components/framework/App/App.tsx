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
    theme: any;
    menus: React.FunctionComponent[];
};

type State = {
    sidebarOpen: boolean;
};

class App extends React.Component<Props, State> {
    static propTypes =  {
        ...corePropTypes,
        theme: PropTypes.any.isRequired,
        menus: PropTypes.arrayOf(PropTypes.func.isRequired).isRequired,
    };

    static contextType = CoreContext;

    state = {
        sidebarOpen: false,
    };

    handleSidebarOpen = () => {
        this.setState({ sidebarOpen: true });
    }

    handleSidebarClose = () => {
        this.setState({ sidebarOpen: false });
    }

    render() {
        const { classes, theme, children, menus } = this.props;
        const { sidebarOpen } = this.state;

        return (
            <div className={classes.root}>
                <CssBaseline />
                <Navbar
                    classes={classes}
                    handleSidebarOpen={this.handleSidebarOpen}
                />
                <Sidebar
                    theme={theme}
                    sideBarOpen={sidebarOpen}
                    handleSidebarClose={this.handleSidebarClose}
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
