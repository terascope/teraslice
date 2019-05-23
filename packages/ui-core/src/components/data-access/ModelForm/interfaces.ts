import PropTypes from 'prop-types';
import { InputOnChangeData, DropdownProps } from 'semantic-ui-react';

export type ErrorsState<T> = { fields: (keyof T)[]; messages: string[] };

export type FieldOptions<T> = {
    name: keyof T;
    label: string;
    placeholder?: string;
};

export type ComponentProps<T = any> = {
    [prop: string]: any;
    input: T;
    id?: string;
};

export const ComponentPropTypes = {
    id: PropTypes.string,
    input: PropTypes.any.isRequired,
};

export type ChangeFn = (e: any, data: InputOnChangeData | DropdownProps) => void;
