import { Space, Role, DataType, View, SpaceSearchConfig } from '@terascope/data-access';
import { Overwrite } from '@terascope/utils';
import { OverwriteModelWith } from '../ModelForm';

type SpaceDataType = Overwrite<
    Pick<DataType, 'id' | 'name'>,
    {
        views: Pick<View, 'id' | 'name'>[];
    }
>;

export type Input = OverwriteModelWith<
    Space,
    {
        views: Pick<View, 'id' | 'name'>[];
        roles: Pick<Role, 'id' | 'name'>[];
        data_type: SpaceDataType;
        search_config: SpaceSearchConfig;
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
