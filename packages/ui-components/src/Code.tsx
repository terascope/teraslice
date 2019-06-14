import React from 'react';
import PropTypes from 'prop-types';

const Code: React.FC<Props> = ({ children, inline }) => {
    return <pre className={`code${inline ? ' inline' : ''}`}>{children}</pre>;
};

type Props = {
    inline?: boolean;
    children: any;
};

Code.propTypes = {
    inline: PropTypes.bool,
    children: PropTypes.any.isRequired,
};

export default Code;
