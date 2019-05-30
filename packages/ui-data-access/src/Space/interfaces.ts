import { Space, Role, DataType, View } from '@terascope/data-access';
import { Overwrite } from '@terascope/utils';

export type Input = Overwrite<
    Space,
    {
        id?: string;
        client_id: number | string;
        views: Pick<View, 'id' | 'name'>[];
        roles: Pick<Role, 'id' | 'name'>[];
        data_type: Pick<DataType, 'id' | 'name'>[];
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

export type SpaceRole = {
    id: string;
    name: string;
};

export type SpaceView = {
    id: string;
    name: string;
};

export type SpaceDataType = {
    id: string;
    name: string;
};
