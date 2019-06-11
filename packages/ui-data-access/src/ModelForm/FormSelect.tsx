import React, { ReactElement } from 'react';
import PropTypes from 'prop-types';
import { Form, FormSelectProps } from 'semantic-ui-react';
import { DefaultInputProps, AnyModel, SelectOption } from './interfaces';
import {
    castArray,
    getFirst,
    Overwrite,
} from '@terascope/utils';
import { getSelectOptions, getSelectValue, mapFormOptions } from './utils';

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
            options={mapFormOptions(options, sorted)}
            error={hasError(name)}
            required={isRequired(name)}
            {...props}
        >
            {children}
        </Form.Select>
    );
}

export type Props<T> = Overwrite<
    FormSelectProps,
    {
        options: SelectOption[];
        value?: SelectOption | SelectOption[];
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
