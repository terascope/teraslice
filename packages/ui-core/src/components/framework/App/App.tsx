import React, { useState } from 'react';
import { Segment } from 'semantic-ui-react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';

const App: React.FC = ({ children }) => {
    const [sidebarOpen, setState] = useState(false);

    const toggleSidebar = () => setState(!sidebarOpen);

    return (
        <div className="appRoot">
            <div className="sidebarWrapper">
                <Sidebar sidebarOpen={sidebarOpen} />
            </div>
            <Segment secondary className="contentWrapper">
                <Navbar toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
                <main>{children}</main>
                <Footer />
            </Segment>
        </div>
    );
};

export default App;
