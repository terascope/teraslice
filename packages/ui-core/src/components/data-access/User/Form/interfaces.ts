import { UserType } from '@terascope/data-access';

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

export type Role = {
    id: string;
    name: string;
};
