import { Space, Role, DataType, View } from '@terascope/data-access';
import { Overwrite } from '@terascope/utils';

type SpaceDataType = Overwrite<
    Pick<DataType, 'id' | 'name'>,
    {
        views: Pick<View, 'id' | 'name'>[];
    }
>;

export type Input = Overwrite<
    Space,
    {
        id?: string;
        client_id: number | string;
        views: Pick<View, 'id' | 'name'>[];
        roles: Pick<Role, 'id' | 'name'>[];
        data_type: SpaceDataType;
    }
>;

export const inputFields: (keyof Input)[] = [
    'id',
    'client_id',
    'name',
    'description',
    'search_config',
    'endpoint',
    'roles',
    'views',
    'data_type',
];
