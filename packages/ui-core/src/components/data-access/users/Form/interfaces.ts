import PropTypes from 'prop-types';
import { UserType } from '@terascope/data-access';
import { InputOnChangeData, DropdownProps } from 'semantic-ui-react';

export type Input = {
    id?: string;
    client_id: number | string;
    firstname: string;
    lastname: string;
    username: string;
    email: string;
    password: string;
    repeat_password: string;
    type: UserType;
    role: string;
    api_token: string;
};

export const inputFields: (keyof Input)[] = [
    'id',
    'client_id',
    'firstname',
    'lastname',
    'username',
    'email',
    'role',
    'type',
    'password',
    'repeat_password',
    'api_token',
];

export const userTypes: UserType[] = ['USER', 'ADMIN', 'SUPERADMIN'];
export const userTypeOptions = userTypes.map(type => ({
    key: type,
    text: type,
    value: type,
}));

export type ChangeFn = (e: any, data: InputOnChangeData | DropdownProps) => void;

export type FieldOptions = {
    name: keyof Input;
    label: string;
    placeholder?: string;
};

export type ErrorsState = { fields: string[]; messages: string[] };

export type Role = {
    id: string;
    name: string;
};

export type ComponentProps = {
    roles: Role[];
    input: Input;
    id?: string;
};

export const ComponentPropTypes = {
    roles: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
        }).isRequired
    ).isRequired,
    id: PropTypes.string,
    input: PropTypes.any.isRequired,
};
