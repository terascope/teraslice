import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import { ActionSegment } from '@terascope/ui-components';

const ResolvedField: React.FC<Props> = ({ field, type }) => {
    return (
        <ActionSegment>
            <Form.Group style={{ paddingTop: '0.8rem' }}>
                <Form.Input value={field} disabled />
                <Form.Input value={type} disabled />
            </Form.Group>
        </ActionSegment>
    );
};

type Props = {
    field: string;
    type: string;
};

ResolvedField.propTypes = {
    field: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
};

export default ResolvedField;
