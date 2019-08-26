import React from 'react';
import PropTypes from 'prop-types';
import { tsWithRouter } from './utils';
import ErrorMessage from './ErrorMessage';
import SuccessMessage from './SuccessMessage';

const StateMessage = tsWithRouter<Props>(({ location, attached }) => {
    if (!location.state || !location.state.message) return <div />;
    const { success, message, title } = location.state.message;
    if (success) {
        return (
            <SuccessMessage
                title={title}
                attached={attached}
                message={message}
            />
        );
    }
    return <ErrorMessage title={title} error={message} attached={attached} />;
});

type Props = {
    attached?: 'bottom' | 'top';
};

StateMessage.propTypes = {
    attached: PropTypes.oneOf(['bottom', 'top']),
};

export default StateMessage;
