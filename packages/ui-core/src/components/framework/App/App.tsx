import React from 'react';
import { Segment } from 'semantic-ui-react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';

const App: React.FC = ({ children }) => {
    return (
        <div className="appRoot">
            <div className="sidebarWrapper">
                <Sidebar />
            </div>
            <Segment secondary basic className="contentWrapper">
                <Navbar />
                <main className="contentMain">{children}</main>
                <Footer />
            </Segment>
        </div>
    );
};

export default App;
