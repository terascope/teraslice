import { User, Role } from '@terascope/data-access';
import { OverwriteModelWith } from '../ModelForm';

export type Input = OverwriteModelWith<
    User,
    {
        password: string;
        repeat_password: string;
        role: Pick<Role, 'id' | 'name'>;
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
