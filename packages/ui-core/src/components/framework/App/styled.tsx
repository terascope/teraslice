import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { Icon, Menu, Segment } from 'semantic-ui-react';

export const SidebarIcon = styled(Icon)`
    font-size: 1.6em !important;
`;

export const SidebarOpenedIcon = styled(SidebarIcon)`
    padding-right: 2.1rem;
`;

export const SidebarClosedIcon = styled(SidebarIcon)`
    padding-right: 0;
`;

export const SidebarToggle = styled(Menu.Item)`
    display: flex !important;
    flex-direction: column;
    align-items: flex-end;
    min-height: 3.9rem !important;
    justify-content: center;
`;

export const SidebarMenu = styled(Menu)`
    ${props => (props.open ? '' : 'width: 4rem !important;')};
    display: flex !important;
    flex-flow: column nowrap;
    justify-content: flex-start;
`;

export const SidebarItemName = styled.div`
    padding-top: 0.3rem;
    font-weight: 600;
`;

export const SidebarMenuItem = styled(Menu.Item)`
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-between;
`;

export const TitleMenuItem = styled(Menu.Item)`
    display: flex;
    flex: 1 !important;
    font-size: 1.2rem;
`;

export const NavbarMenu = styled(Menu)`
    min-height: 4rem !important;
`;

export const DropdownIcon = styled(Icon)`
    font-size: 1.6rem !important;
    margin-right: 0 !important;
`;

export const BasicLink = styled(Link)`
    box-shadow: none;
`;

export const FooterContent = styled.footer`
    align-self: flex-end;
    width: 100%;
    flex: 1;
`;

export const AppRoot = styled.div`
    height: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: row;
`;

export const SidebarWrapper = styled.div`
    display: flex;
    flex-flow: row nowrap;
    margin-top: -3px !important;
    z-index: 9999;
`;

export const Main = styled.main`
    height: 100%;
    flex: 1;
    margin: 2rem 0;
`;

export const AppContent = styled(Segment)`
    display: flex;
    flex-flow: column nowrap;
    flex: 1;
    z-index: 1;
    margin: -3px 0 0 -1px !important;
    padding: 0 !important;
`;
