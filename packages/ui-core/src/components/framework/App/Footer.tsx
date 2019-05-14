import React from 'react';
import { Segment } from 'semantic-ui-react';

const Footer: React.FC = () => {
    return (
        <Segment as="footer" textAlign="center" className="appFooter">
            Copyright &copy; 2019
        </Segment>
    );
};

export default Footer;
