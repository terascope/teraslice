import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import { ActionSegment } from '@terascope/ui-components';
import ArrayCheckbox from './ArrayCheckbox';

const ResolvedField: React.FC<Props> = ({ field, type, array }) => {
    return (
        <ActionSegment>
            <Form.Group>
                <Form.Input value={field} disabled />
                <Form.Input value={type} disabled />
                <ArrayCheckbox array={array} onChange={() => {}} />
            </Form.Group>
        </ActionSegment>
    );
};

type Props = {
    field: string;
    type: string;
    array?: boolean;
};

ResolvedField.propTypes = {
    field: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    array: PropTypes.bool,
};

export default ResolvedField;
