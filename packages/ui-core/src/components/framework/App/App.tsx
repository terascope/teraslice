import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';

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
            <Sidebar sidebarOpen={sidebarOpen} menus={menus} />
            <main>
                <div>{children}</div>
                <Footer />
            </main>
        </div>
    );
};

App.propTypes = {
    menus: PropTypes.arrayOf(PropTypes.func.isRequired).isRequired,
};

export default App;
