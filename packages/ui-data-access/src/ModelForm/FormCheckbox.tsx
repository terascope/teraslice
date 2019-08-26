import React, { ReactElement } from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import { ChangeFn } from './interfaces';

function FormCheckbox<T>({
    label,
    name,
    value,
    onChange,
}: Props<T>): ReactElement {
    return (
        <Form.Checkbox
            className="daFormCheckbox"
            name={name as string}
            label={label}
            checked={Boolean(value)}
            onChange={(e, { checked }) => {
                onChange(e, { name, value: checked });
            }}
        />
    );
}

export type Props<T> = {
    value?: boolean;
    name: keyof T;
    label: string;
    onChange: ChangeFn;
};

FormCheckbox.propTypes = {
    name: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
};

export default FormCheckbox;
