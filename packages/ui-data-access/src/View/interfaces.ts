import { Overwrite } from '@terascope/utils';
import { View, DataType, Role, Space } from '@terascope/data-access';
import { OverwriteModelWith } from '../ModelForm';

type ViewSpace = Overwrite<
    Pick<Space, 'id' | 'name' | 'roles'>,
    {
        roles: Pick<Role, 'id' | 'name'>[];
    }
>;

export type Input = OverwriteModelWith<
    View,
    {
        space: ViewSpace;
        data_type: Pick<DataType, 'id' | 'client_id' | 'name' | 'type_config'>;
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
    'space',
];
