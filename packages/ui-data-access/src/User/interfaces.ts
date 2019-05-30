import { User, Role } from '@terascope/data-access';
import { Overwrite } from '@terascope/utils';

export type Input = Overwrite<
    User,
    {
        id?: string;
        client_id: number | string;
        password: string;
        repeat_password: string;
    }
>;

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

export type UserRole = Pick<Role, 'id' | 'name'>;
