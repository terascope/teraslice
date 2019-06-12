import { DataType } from '@terascope/data-access';
import { AnyObject } from '@terascope/utils';
import { OverwriteModelWith } from '../ModelForm';

export type Input = OverwriteModelWith<
    DataType,
    {
        type_config: AnyObject;
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
    'Object',
];

export const dataTypeOptions = availableDataTypes.sort().map(t => ({
    key: t,
    text: t,
    value: t,
}));

export const dataTypeVersions = ['1'];
