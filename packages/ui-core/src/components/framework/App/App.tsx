import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';
import * as s from './styled';

const App: React.FC = ({ children }) => {
    return (
        <s.AppRoot>
            <s.SidebarWrapper>
                <Sidebar />
            </s.SidebarWrapper>
            <s.AppContent secondary basic>
                <Navbar />
                <s.Main>{children}</s.Main>
                <Footer />
            </s.AppContent>
        </s.AppRoot>
    );
};

export default App;
