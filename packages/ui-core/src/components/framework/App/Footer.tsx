import React from 'react';
import styled from 'styled-components';
import { Segment } from 'semantic-ui-react';

const FooterContent = styled.footer`
    align-self: flex-end;
    width: 100%;
    flex: 1;
`;

const Footer: React.FC = () => {
    return (
        <Segment as={FooterContent} textAlign="center">
            Copyright &copy; 2019
        </Segment>
    );
};

export default Footer;
