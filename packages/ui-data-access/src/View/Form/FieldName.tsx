import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'semantic-ui-react';

const FieldName: React.FC<Props> = ({
    field = '',
    onChange,
    invalid,
    available,
    readonly,
}) => {
    if (readonly) {
        return (
            <Form.Input label="Field" value={field}>
                <input readOnly />
            </Form.Input>
        );
    }

    return (
        <Form.Select
            label="Field"
            placeholder="Choose a field"
            error={invalid}
            options={getFieldOptions(available)}
            value={field}
            onChange={(e, { value }) => {
                onChange(value as string);
            }}
        />
    );
};

type DropdownOption = {
    key: string;
    text: string;
    value: string;
    disabled?: boolean;
};
function getFieldOptions(available: string[] = []) {
    const options: DropdownOption[] = [];
    for (const field of available) {
        if (!field) continue;

        const parts: string[] = [];
        for (const _part of field.trim().split('.')) {
            const part = _part.trim();
            if (!part) continue;
            parts.push(part);

            const path = parts.join('.');
            if (options.some(({ key }) => key === path)) continue;
            options.push({
                key: path,
                text: path,
                value: path,
            });
        }
    }
    return options;
}

type Props = {
    field: string;
    available: string[];
    invalid?: boolean;
    readonly?: boolean;
    onChange: (field: string) => void;
};

FieldName.propTypes = {
    field: PropTypes.string.isRequired,
    available: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    readonly: PropTypes.bool,
    invalid: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
};

export default FieldName;
