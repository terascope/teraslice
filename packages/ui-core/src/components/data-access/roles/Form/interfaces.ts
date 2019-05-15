import PropTypes from 'prop-types';
import { InputOnChangeData, DropdownProps } from 'semantic-ui-react';

export type Input = {
    id?: string;
    client_id: number;
    name: string;
    description: string;
};

export const inputFields: (keyof Input)[] = ['id', 'client_id', 'description', 'name'];

export type ChangeFn = (e: any, data: InputOnChangeData | DropdownProps) => void;

export type FieldOptions = {
    name: keyof Input;
    label: string;
    placeholder?: string;
};

export type ErrorsState = { fields: string[]; messages: string[] };

export type ComponentProps = {
    input: Input;
    id?: string;
};

export const ComponentPropTypes = {
    id: PropTypes.string,
    input: PropTypes.any.isRequired,
};
