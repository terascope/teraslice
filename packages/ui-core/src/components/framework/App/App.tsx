import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';
import { Grid } from 'semantic-ui-react';

type Props = {
    menus: React.FunctionComponent[];
};

type State = {
    sidebarOpen: boolean;
};

const App: React.FC<Props> = ({ children, menus }) => {
    const [sidebarOpen, setState] = useState(false);

    const toggleSidebar = () => setState(!sidebarOpen);
    return (
        <div>
            <Navbar toggleSidebar={toggleSidebar} />
            <Grid columns={2} divided>
                <Grid.Row stretched>
                    <Grid.Column width={2}>
                        <Sidebar sidebarOpen={sidebarOpen} menus={menus} />
                    </Grid.Column>
                    <main>
                        {children}
                    </main>
                </Grid.Row>
                <Grid.Row centered>
                    <Grid.Column width={16}>
                        <Footer />
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </div>
    );
};

App.propTypes = {
    menus: PropTypes.arrayOf(PropTypes.func.isRequired).isRequired,
};

export default App;
