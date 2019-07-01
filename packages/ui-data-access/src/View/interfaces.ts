import { View, DataType, Role, Space } from '@terascope/data-access';
import { OverwriteModelWith } from '../ModelForm';

export type Input = OverwriteModelWith<
    View,
    {
        spaces: (Pick<Space, 'id' | 'name'>)[];
        data_type: Pick<DataType, 'id' | 'client_id' | 'name'>;
        roles: (Pick<Role, 'id' | 'name'>)[];
    }
>;

export const inputFields: (keyof Input)[] = [
    'id',
    'client_id',
    'description',
    'name',
    'excludes',
    'includes',
    'constraint',
    'prevent_prefix_wildcard',
    'data_type',
    'roles',
    'spaces',
];
