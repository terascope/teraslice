import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';

const FieldName: React.FC<Props> = ({ field = '', onChange, invalid }) => {
    return (
        <Form.Input
            label="Field Name"
            value={field}
            error={invalid}
            onChange={(e, { value }) => {
                e.preventDefault();
                onChange(value);
            }}
        />
    );
};

type Props = {
    field: string;
    invalid?: boolean;
    onChange: (field: string) => void;
};

FieldName.propTypes = {
    field: PropTypes.string.isRequired,
    invalid: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
};

export default FieldName;
