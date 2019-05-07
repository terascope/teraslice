import React from 'react';
import { Segment } from 'semantic-ui-react';

const Footer: React.FC = () => {
    return (
        <Segment as="footer" className="contentFooter" textAlign="center">
            Copyright &copy; 2019
        </Segment>
    );
};

export default Footer;
