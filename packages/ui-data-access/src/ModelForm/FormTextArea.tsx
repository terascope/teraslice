import React, { ReactElement } from 'react';
import PropTypes from 'prop-types';
import { Form, TextAreaProps } from 'semantic-ui-react';
import { DefaultInputProps } from './interfaces';
import { Overwrite } from 'convict';

function FormTextArea<T>({
    label,
    name,
    value = '',
    hasError,
    isRequired,
    onChange,
    ...props
}: Props<T>): ReactElement {
    return (
        <Form.TextArea
            className="daFormTextArea"
            name={name as string}
            label={label}
            value={value}
            onChange={onChange}
            error={hasError(name)}
            required={isRequired(name)}
            {...props}
        />
    );
}

export type Props<T> = Overwrite<
    TextAreaProps,
    {
        value?: string;
        name: keyof T;
    }
> &
    DefaultInputProps<T>;

FormTextArea.propTypes = {
    name: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
};

export default FormTextArea;
