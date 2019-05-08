import React from 'react';
import { Segment } from 'semantic-ui-react';
import { FooterContent } from './styled';

const Footer: React.FC = () => {
    return (
        <Segment as={FooterContent} textAlign="center">
            Copyright &copy; 2019
        </Segment>
    );
};

export default Footer;
