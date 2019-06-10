import React, { ReactElement } from 'react';
import PropTypes from 'prop-types';
import { Form, FormSelectProps } from 'semantic-ui-react';
import { DefaultInputProps, AnyModel } from './interfaces';
import {
    castArray,
    getFirst,
    Overwrite,
    trimAndToLower,
} from '@terascope/utils';

function FormSelect<T extends AnyModel>({
    placeholder,
    label,
    name,
    options: _options,
    value: _value,
    onChange,
    hasError,
    isRequired,
    children,
    multiple = false,
    sorted,
    ...props
}: Props<T>): ReactElement {
    const options = getSelectOptions(_options);
    return (
        <Form.Select
            name={name}
            label={label}
            placeholder={placeholder || label}
            value={getSelectValue(_value, multiple)}
            search={true}
            multiple={multiple}
            selection={multiple}
            onChange={(e, arg) => {
                const result = options.filter(opt => {
                    return castArray(arg.value as string[] | string).includes(
                        opt.id
                    );
                });

                const selected: any = multiple
                    ? castArray(result)
                    : getFirst(result);

                onChange(e, { name, value: selected });
            }}
            options={getOptions(options, sorted)}
            error={hasError(name)}
            required={isRequired(name)}
            {...props}
        >
            {children}
        </Form.Select>
    );
}

function getSelectValue(
    value?: Value | Value[],
    multiple?: boolean
): string | string[] | undefined {
    if (!value) return undefined;
    if (multiple || Array.isArray(value)) {
        return castArray(value)
            .map(val => val && val.id)
            .filter(val => !!val);
    }
    return value.id;
}

function getSelectOptions(options?: Value[]): Value[] {
    if (!options) return [];
    return castArray(options).filter(opt => !!opt);
}

function getOptions(options: Value[], sorted?: boolean) {
    const mapped = options.map(opt => ({
        key: opt.id,
        text: opt.name || opt.id,
        value: opt.id,
    }));
    if (sorted === false) return mapped;
    return mapped.sort((a, b) => {
        const aText = trimAndToLower(a.text);
        const bText = trimAndToLower(b.text);
        if (aText > bText) {
            return 1;
        }
        if (aText < bText) {
            return -1;
        }
        return 0;
    });
}

type Value = { id: string; name: string };
export type Props<T> = Overwrite<
    FormSelectProps,
    {
        options: Value[];
        value?: Value | Value[];
        name: keyof T;
        label: string;
        multiple?: boolean;
        placeholder?: string;
        sorted?: boolean;
    }
> &
    DefaultInputProps<T>;

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
    multiple: PropTypes.bool,
    options: ValueProps,
    sorted: PropTypes.bool,
    hasError: PropTypes.func.isRequired,
    isRequired: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
};

export default FormSelect;
