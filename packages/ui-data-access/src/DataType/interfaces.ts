import { Override } from '@terascope/utils';
import { DataType } from '@terascope/data-access';

export type Input = Override<
    DataType,
    {
        id?: string;
        client_id: number | string;
    }
>;

export const inputFields: (keyof Input)[] = ['id', 'client_id', 'description', 'name', 'type_config'];

export const availableDataTypes = [
    'Boolean',
    'Date',
    'Geo',
    'IP',
    'Byte',
    'Double',
    'Float',
    'Integer',
    'Keyword',
    'Long',
    'Short',
    'Text',
];

export const dataTypeOptions = availableDataTypes.map(t => ({
    key: t,
    text: t,
    value: t,
}));
