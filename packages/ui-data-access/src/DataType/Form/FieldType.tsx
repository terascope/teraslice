import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import { dataTypeOptions, availableDataTypes } from '../interfaces';

const FieldType: React.FC<Props> = ({ type, onChange }) => {
    const isInvalid = Boolean(type && !availableDataTypes.includes(type));
    return (
        <Form.Select
            label="Field Type"
            placeholder="Select Field Type"
            value={type}
            error={isInvalid}
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
    onChange: (type: any) => void;
};

FieldType.propTypes = {
    type: PropTypes.any.isRequired,
    onChange: PropTypes.any.isRequired,
};

export default FieldType;
