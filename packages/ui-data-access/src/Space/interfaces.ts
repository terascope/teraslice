import { Space, Role, DataType, View, SpaceSearchConfig, SpaceConfigType } from '@terascope/data-access';
import { Overwrite } from '@terascope/utils';
import { OverwriteModelWith } from '../ModelForm';

type SpaceDataType = Overwrite<
    Pick<DataType, 'id' | 'client_id' | 'name'>,
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
        config: SpaceSearchConfig;
    }
>;

export const inputFields: (keyof Input)[] = [
    'id',
    'client_id',
    'type',
    'name',
    'description',
    'config',
    'endpoint',
    'roles',
    'views',
    'data_type',
];

export const spaceConfigTypes: SpaceConfigType[] = ['SEARCH'];
