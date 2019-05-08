import React from 'react';
import styled from 'styled-components';
import { Segment } from 'semantic-ui-react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';

const AppRoot = styled.div`
    height: 100%;
    min-height: 100%;
    display: flex;
	flex-direction: row;
`;

const SidebarWrapper = styled.div`
    display: flex;
    flex-flow: row nowrap;
    margin-top: -3px !important;
    z-index: 9999;
`;

const Main = styled.main`
    height: 100%;
    flex: 1;
`;

const Content = styled(Segment)`
    display: flex;
    flex-flow: column nowrap;
    flex: 1;
    z-index: 1;
    margin: -3px 0 0 -1px !important;
    padding: 0 !important;
`;

const App: React.FC = ({ children }) => {
    return (
        <AppRoot>
            <SidebarWrapper>
                <Sidebar />
            </SidebarWrapper>
            <Content secondary basic>
                <Navbar />
                <Main>{children}</Main>
                <Footer />
            </Content>
        </AppRoot>
    );
};

export default App;
