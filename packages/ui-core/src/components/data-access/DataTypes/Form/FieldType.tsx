import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import { dataTypeOptions } from './interfaces';

const FieldType: React.FC<Props> = ({ type, onChange, width = 4, invalid }) => {
    return (
        <Form.Select
            width={width as any}
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
    width?: number;
    onChange: (type: any) => void;
};

FieldType.propTypes = {
    width: PropTypes.number,
    invalid: PropTypes.bool,
    type: PropTypes.any.isRequired,
    onChange: PropTypes.any.isRequired,
};

export default FieldType;
