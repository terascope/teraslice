import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';
import { Segment } from 'semantic-ui-react';

const App: React.FC = ({ children }) => {
    return (
        <div className="appRoot">
            <div className="sidebarWrapper">
                <Sidebar />
            </div>
            <Segment className="appContent" secondary basic>
                <Navbar />
                <main className="appMain">{children}</main>
                <Footer />
            </Segment>
        </div>
    );
};

export default App;
