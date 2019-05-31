import { Overwrite } from '@terascope/utils';
import { View, DataType, Role, Space } from '@terascope/data-access';

type ViewSpace = Overwrite<
    Pick<Space, 'id' | 'name' | 'roles'>,
    {
        roles: Pick<Role, 'id' | 'name'>[];
    }
>;

export type Input = Overwrite<
    View,
    {
        id?: string;
        client_id: number | string;
        space: ViewSpace;
        data_type?: Pick<DataType, 'id' | 'name' | 'type_config'>;
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
