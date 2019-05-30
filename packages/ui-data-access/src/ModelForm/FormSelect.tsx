import React, { ReactElement } from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';
import { DefaultInputProps, AnyModel } from './interfaces';

function FormSelect<T extends AnyModel>({
    placeholder,
    label,
    name,
    options,
    value,
    onChange,
    hasError,
    isRequired,
    children,
    ...props
}: Props<T>): ReactElement {
    return (
        <Form.Select
            {...{
                name,
                label,
                placeholder: placeholder || label,
                value: Array.isArray(value)
                    ? value.map(val => val.id)
                    : value.id,
                multiple: Array.isArray(value),
                onChange: (e, arg) => {
                    const selected = options.find(
                        opt => opt.id === arg.value
                    ) as any;
                    onChange(e, { name, value: selected });
                },
                options: options.map(opt => ({
                    key: opt.id,
                    text: opt.name,
                    value: opt.id,
                })),
                error: hasError(name),
                required: isRequired(name),
            }}
            {...props}
        >
            {children}
        </Form.Select>
    );
}

type Value = { id: string; name: string };
export type Props<T> = {
    [prop: string]: any;
    options: Value[];
    value: Value | Value[];
    name: keyof T;
    label: string;
    placeholder?: string;
} & DefaultInputProps<T>;

const ValueProp = PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
}).isRequired;

const ValueProps = PropTypes.arrayOf(ValueProp).isRequired;

FormSelect.propTypes = {
    name: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    value: PropTypes.oneOf([ValueProps, ValueProp]),
    options: ValueProps,
    hasError: PropTypes.func.isRequired,
    isRequired: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
};

export default FormSelect;
