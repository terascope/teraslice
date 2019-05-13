import PropTypes from 'prop-types';
import { UserType } from '@terascope/data-access';
import { InputOnChangeData, DropdownProps } from 'semantic-ui-react';

export type UserInput = {
    id?: string;
    client_id: number;
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

export const userInputFields: (keyof UserInput)[] = [
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
export const userTypeOptions = userTypes.map((type) => ({
    key: type,
    text: type,
    value: type,
}));

export type ChangeFn = (e: any, data: InputOnChangeData | DropdownProps) => void;

export type FieldOptions = {
    name: keyof UserInput;
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
    userInput: UserInput;
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
    userInput: PropTypes.any.isRequired,
};
