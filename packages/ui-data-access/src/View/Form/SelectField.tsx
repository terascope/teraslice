import React from 'react';
import PropTypes from 'prop-types';
import { Select } from 'semantic-ui-react';
import FieldParts from './FieldParts';

const SelectField: React.FC<Props> = ({
    field = '',
    onChange,
    invalid,
    available,
}) => {
    return (
        <Select
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
    content: any;
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
                content: <FieldParts field={path} />,
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
    onChange: (field: string) => void;
};

SelectField.propTypes = {
    field: PropTypes.string.isRequired,
    available: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    invalid: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
};

export default SelectField;
