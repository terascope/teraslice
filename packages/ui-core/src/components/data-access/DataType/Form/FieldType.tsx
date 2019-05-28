import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import { dataTypeOptions } from './interfaces';

const FieldType: React.FC<Props> = ({ type, onChange, invalid }) => {
    return (
        <Form.Select
            label="Field Type"
            placeholder="Select Field Type"
            value={type}
            error={invalid}
            onChange={(e, { value }) => {
                e.preventDefault();
                onChange(value);
            }}
            options={dataTypeOptions}
        />
    );
};

type Props = {
    type: any;
    invalid?: boolean;
    onChange: (type: any) => void;
};

FieldType.propTypes = {
    invalid: PropTypes.bool,
    type: PropTypes.any.isRequired,
    onChange: PropTypes.any.isRequired,
};

export default FieldType;
