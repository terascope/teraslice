import React, { ReactElement } from 'react';
import PropTypes from 'prop-types';
import { Form, FormComponent } from 'semantic-ui-react';
import { DefaultInputProps, AnyModel } from './interfaces';

function FormInput<T extends AnyModel>({
    placeholder,
    label,
    name,
    value,
    onChange,
    hasError,
    isRequired,
    as = Form.Input,
    children,
    ...props
}: Props<T>): ReactElement {
    const Component = as;

    if (value == null) {
        console.error(`Missing value for field ${name} on model`);
    }

    return (
        <Component
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
        </Component>
    );
}

export type Props<T> = {
    [prop: string]: any;
    value: any;
    name: keyof T;
    label: string;
    placeholder?: string;
    as?: FormComponent | any;
} & DefaultInputProps<T>;

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
