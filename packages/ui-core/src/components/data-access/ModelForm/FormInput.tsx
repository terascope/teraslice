import React from 'react';
import PropTypes from 'prop-types';
import { ErrorsState, ErrorsStateProp, ChangeFn } from './interfaces';
import { Form, FormComponent } from 'semantic-ui-react';
import { AnyObject, get } from '@terascope/utils';

const FormInput: React.FC<Props> = ({
    type,
    errors,
    model,
    children,
    required,
    placeholder,
    label,
    name,
    setModel,
    validate,
    as = Form.Input,
    ...props
}) => {
    const hasError = errors.fields.includes(name);
    const Component = as;
    const onChange: ChangeFn = (e, { name, value }) => {
        setModel(
            Object.assign(model, {
                [name]: value,
            })
        );
        validate();
    };

    if (model[name] == null) {
        console.error(`Missing field ${name} on model`);
    }

    return (
        <Component
            {...{
                name,
                label,
                placeholder: placeholder || label,
                value: get(model, name, ''),
                onChange,
                error: hasError,
                required: required.includes(name),
                width: 4,
            }}
            {...props}
        >
            {children}
        </Component>
    );
};

export function wrapFormInput(props: DefaultProps) {
    return (customProps: Props) => {
        return <FormInput {...props} {...customProps} />;
    };
}

export type Props = {
    [prop: string]: any;
    name: string;
    label: string;
    placeholder?: string;
    as?: FormComponent;
};

type DefaultProps = {
    model: AnyObject;
    errors: ErrorsState;
    required: string[];
    setModel: (model: AnyObject) => void;
    validate: () => boolean;
};

FormInput.propTypes = {
    model: PropTypes.object.isRequired,
    errors: ErrorsStateProp.isRequired,
    required: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    setModel: PropTypes.func.isRequired,
    validate: PropTypes.func.isRequired,
};

export default FormInput;
