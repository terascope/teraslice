import { Space } from '@terascope/data-access';
import { Overwrite } from '@terascope/utils';

export type Input = Overwrite<
    Space,
    {
        id?: string;
        client_id: number | string;
    }
>;

export const inputFields: (keyof Input)[] = ['id', 'client_id', 'name', 'description', 'search_config', 'endpoint', 'roles', 'views'];
