import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import { getFieldOptions } from './utils';

const SelectField: React.FC<Props> = ({
    field = '',
    onChange,
    invalid,
    available,
}) => {
    return (
        <Form.Select
            placeholder="Choose a field"
            error={invalid}
            options={getFieldOptions(available)}
            value={field}
            onChange={(e, { value }) => {
                onChange(value as string);
            }}
        />
    );
};

type Props = {
    field: string;
    available: string[];
    invalid?: boolean;
    onChange: (field: string) => void;
};

SelectField.propTypes = {
    field: PropTypes.string.isRequired,
    available: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    invalid: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
};

export default SelectField;
