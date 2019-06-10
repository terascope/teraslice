import React, { ReactElement } from 'react';
import PropTypes from 'prop-types';
import { Form, FormInputProps } from 'semantic-ui-react';
import { Overwrite } from '@terascope/utils';
import { DefaultInputProps, AnyModel } from './interfaces';

function FormInput<T extends AnyModel>({
    placeholder,
    label,
    name,
    value,
    onChange,
    hasError,
    isRequired,
    children,
    ...props
}: Props<T>): ReactElement {
    if (value == null) {
        console.error(`Missing value for field ${name} on model`);
    }

    return (
        <Form.Input
            {...{
                name,
                label,
                placeholder: placeholder || label,
                value: value != null ? value : '',
                onChange,
                error: hasError(name),
                required: isRequired(name),
            }}
            {...props}
        >
            {children}
        </Form.Input>
    );
}

export type Props<T> = Overwrite<
    FormInputProps,
    {
        name: keyof T;
        label: string;
        placeholder?: string;
    }
> &
    DefaultInputProps<T>;

FormInput.propTypes = {
    name: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    value: PropTypes.string.isRequired,
    hasError: PropTypes.func.isRequired,
    isRequired: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    as: PropTypes.any,
};

export default FormInput;
