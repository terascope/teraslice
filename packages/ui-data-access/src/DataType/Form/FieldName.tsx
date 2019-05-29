import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';

const FieldName: React.FC<Props> = ({
    field = '',
    onChange,
    invalid,
    readonly,
}) => {
    return (
        <Form.Input
            label="Field Name"
            value={field}
            error={invalid}
            onChange={(e, { value }) => {
                onChange(value);
            }}
        >
            <input readOnly={readonly} />
        </Form.Input>
    );
};

type Props = {
    field: string;
    invalid?: boolean;
    readonly?: boolean;
    onChange: (field: string) => void;
};

FieldName.propTypes = {
    field: PropTypes.string.isRequired,
    readonly: PropTypes.bool,
    invalid: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
};

export default FieldName;
