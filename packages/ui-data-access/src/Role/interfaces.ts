import { Overwrite } from '@terascope/utils';
import { Role } from '@terascope/data-access';

export type Input = Overwrite<
    Role,
    {
        id?: string;
        client_id: number | string;
    }
>;

export const inputFields: (keyof Input)[] = ['id', 'client_id', 'description', 'name'];
