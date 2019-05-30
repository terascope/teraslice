import { Overwrite } from '@terascope/utils';
import { View } from '@terascope/data-access';

export type Input = Overwrite<
    View,
    {
        id?: string;
        client_id: number | string;
    }
>;

export const inputFields: (keyof Input)[] = ['id', 'client_id', 'description', 'name', 'excludes', 'includes', 'constraint'];
