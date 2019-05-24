import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';

const FieldName: React.FC<Props> = ({
    field = '',
    onChange,
    width = 4,
    invalid,
}) => {
    return (
        <Form.Input
            width={width as any}
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
    width?: number;
    onChange: (field: string) => void;
};

FieldName.propTypes = {
    field: PropTypes.string.isRequired,
    invalid: PropTypes.bool,
    width: PropTypes.number,
    onChange: PropTypes.func.isRequired,
};

export default FieldName;
