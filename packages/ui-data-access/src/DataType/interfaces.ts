import { DataType } from '@terascope/data-access';
import { OverwriteModel } from '../ModelForm';

export type Input = OverwriteModel<DataType>;

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
