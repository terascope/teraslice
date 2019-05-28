import React from 'react';
import PropTypes from 'prop-types';
import { DefaultInputProps } from './interfaces';
import { Form, FormComponent } from 'semantic-ui-react';

const FormInput: React.FC<Props> = ({
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
}) => {
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
};

export type Props = {
    [prop: string]: any;
    value: string;
    name: string;
    label: string;
    placeholder?: string;
    as?: FormComponent | any;
} & DefaultInputProps;

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
